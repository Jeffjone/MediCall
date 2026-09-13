import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Recall } from "@/lib/recall-matching";

export type ScanLabel = {
  drugName: string | null;
  genericName: string | null;
  strength: string | null;
  dosageForm: string | null;
  ndc: string | null;
  lotNumber: string | null;
  expirationDate: string | null;
  quantity: string | null;
  manufacturer: string | null;
  prescriber: string | null;
  rxNumber: string | null;
  directions: string | null;
  productType: "prescription" | "otc" | "unknown";
  readable: boolean;
  notes: string | null;
};

export type ScanMatch = {
  status: "active-recall" | "possible-recall" | "clear";
  matchedOn: "ndc" | "drug-name" | null;
  recall: Recall | null;
};

export type ScanResponse =
  | { ok: true; label: ScanLabel; match: ScanMatch; recallsChecked: number }
  | { ok: false; message: string };

const labelSchema = z.object({
  drugName: z.string().nullable(),
  genericName: z.string().nullable(),
  strength: z.string().nullable(),
  dosageForm: z.string().nullable(),
  ndc: z.string().nullable(),
  lotNumber: z.string().nullable(),
  expirationDate: z.string().nullable(),
  quantity: z.string().nullable(),
  manufacturer: z.string().nullable(),
  prescriber: z.string().nullable(),
  rxNumber: z.string().nullable(),
  directions: z.string().nullable(),
  productType: z.enum(["prescription", "otc", "unknown"]),
  readable: z.boolean(),
  notes: z.string().nullable(),
});

const PROMPT = `You are a pharmacy label reader. Read the photographed prescription or over-the-counter medication label and transcribe only what is visibly printed.

Rules:
- Never guess. If a field is not legible on the label, return null for it.
- Copy the NDC exactly as printed, keeping its hyphens (for example 12345-678-90).
- readable=false when the photo is too blurry, dark, or does not show a medication label.
- notes: one short sentence about photo quality or anything unclear, otherwise null.

Reply with JSON only, no markdown fence, using exactly these keys:
{"drugName":string|null,"genericName":string|null,"strength":string|null,"dosageForm":string|null,"ndc":string|null,"lotNumber":string|null,"expirationDate":string|null,"quantity":string|null,"manufacturer":string|null,"prescriber":string|null,"rxNumber":string|null,"directions":string|null,"productType":"prescription"|"otc"|"unknown","readable":boolean,"notes":string|null}`;

export const scanLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        // data URL: data:image/jpeg;base64,....
        image: z.string().min(64).max(12_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<ScanResponse> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", context.userId)
      .single();
    if (profile?.approval_status !== "approved") {
      return { ok: false, message: "An approved pharmacy account is required." };
    }

    const { geminiEndpoint } = await import("./gemini.server");
    const endpoint = geminiEndpoint();
    if (!endpoint) return { ok: false, message: "AI is not configured." };

    if (!data.image.startsWith("data:image/")) {
      return { ok: false, message: "Unsupported image format. Take the photo again." };
    }

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                { type: "image_url", image_url: { url: data.image } },
              ],
            },
          ],
        }),
      });
    } catch {
      return { ok: false, message: "Could not reach the scanning service. Try again." };
    }

    if (!response.ok) {
      if (response.status === 429)
        return { ok: false, message: "Too many scans right now. Wait a moment and try again." };
      if (response.status === 402)
        return { ok: false, message: "AI credits are exhausted. Add credits to keep scanning." };
      if (response.status === 403)
        return { ok: false, message: "AI access is blocked for this workspace." };
      return { ok: false, message: `The scanner could not read the photo (${response.status}).` };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);

    let label: ScanLabel;
    try {
      label = labelSchema.parse(JSON.parse(json));
    } catch {
      return { ok: false, message: "The label could not be read. Retake the photo in better light." };
    }

    const { readStoredFeed } = await import("@/lib/recall-sync.server");
    const { normalizeNdc } = await import("@/lib/recall-matching");
    const feed = await readStoredFeed();

    let match: ScanMatch = { status: "clear", matchedOn: null, recall: null };

    if (label.ndc) {
      const target = normalizeNdc(label.ndc);
      const hit = feed.recalls.find((r) =>
        r.ndcCodes.some((code) => normalizeNdc(code) === target),
      );
      if (hit) match = { status: "active-recall", matchedOn: "ndc", recall: hit };
    }

    if (!match.recall) {
      const names = [label.drugName, label.genericName]
        .filter((n): n is string => Boolean(n))
        .map((n) => n.toLowerCase());
      const hit = feed.recalls.find((r) => {
        const drug = r.drugName.toLowerCase();
        return names.some((n) => drug.includes(n) || n.includes(drug));
      });
      if (hit) match = { status: "possible-recall", matchedOn: "drug-name", recall: hit };
    }

    return { ok: true, label, match, recallsChecked: feed.recalls.length };
  });
