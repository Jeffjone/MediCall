import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readReceipt, findCase } from "./analysis.server";
import { normalizeNdc } from "./recall-matching";

import {
  OUTREACH_FIRST_MESSAGE,
  OUTREACH_SYSTEM_PROMPT,
  DOCTOR_FIRST_MESSAGE,
  DOCTOR_SYSTEM_PROMPT,
  renderScript,
} from "@/lib/outreach-script";

const CallInput = z.object({
  patientName: z.string().min(1),
  patientId: z.string().min(1),
  drugName: z.string().min(1),
  strength: z.string(),
  ndc: z.string(),
  recallNumber: z.string(),
  recallReason: z.string(),
  classification: z.string(),
  approval: z.string().optional(),
  pharmacyName: z.string().default("Riverside Pharmacy"),
});

export type CallResult = {
  ok: boolean;
  message: string;
  conversationId?: string;
  dialed?: string;
};

/**
 * Places a real outbound AI voice call through an ElevenLabs conversational
 * agent. For the demo every call dials the single verified test number in
 * DEMO_CALL_NUMBER, never the fake patient's number.
 */
export const placeOutreachCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CallInput.parse(input))
  .handler(async ({ data, context }): Promise<CallResult> => {
    const { data: profile } = await context.supabase.from("profiles").select("approval_status, pharmacy_name").eq("id", context.userId).single();
    if (profile?.approval_status !== "approved") return { ok: false, message: "An approved pharmacy account is required." };
    const { readStoredFeed } = await import("./recall-sync.server");
    const feed = await readStoredFeed();
    const { patient, flagged } = findCase(data.patientId, data.recallNumber, data.ndc, feed.recalls);
    data = { ...data, patientName: patient.fullName, drugName: flagged.prescription.drugName, strength: flagged.prescription.strength, recallReason: flagged.recall.reasonForRecall, classification: flagged.recall.classification, pharmacyName: profile.pharmacy_name };
    const approved = data.approval ? readReceipt(data.approval, context.userId) : null;
    if (approved && (!approved.approvedName || !approved.script || approved.patientId !== data.patientId || approved.recallNumber !== data.recallNumber || approved.ndc !== normalizeNdc(data.ndc))) return { ok: false, message: "Approval does not match this prescription." };
    const apiKey = process.env["ELEVENLABS_API_KEY"];
    const agentId = process.env["ELEVENLABS_AGENT_ID"];
    const phoneNumberId = process.env["ELEVENLABS_PHONE_NUMBER_ID"];
    const toNumber = process.env["DEMO_CALL_NUMBER"];

    const missing = [
      !apiKey && "the ElevenLabs connection",
      !agentId && "the voice agent ID",
      !phoneNumberId && "the ElevenLabs phone number ID",
      !toNumber && "the demo phone number to dial",
    ].filter(Boolean);

    if (missing.length > 0) {
      return {
        ok: false,
        message: `Calling is not set up yet — still missing ${missing.join(", ")}.`,
      };
    }

    const summary =
      `${data.patientName} (patient ${data.patientId}) is currently prescribed ` +
      `${data.drugName} ${data.strength}, NDC ${data.ndc}. ${data.recallNumber.startsWith("DEMO-") ? "This is a fictional demo, not an FDA recall. Simulated" : "The FDA has issued a"} ` +
      `${data.classification} recall (${data.recallNumber}). Reason: ${data.recallReason}`;

    const vars: Record<string, string> = {
      patient_name: data.patientName,
      patient_id: data.patientId,
      drug_name: data.drugName,
      recalled_medication_name: data.drugName,
      drug_strength: data.strength,
      ndc: data.ndc,
      recall_number: data.recallNumber,
      recall_reason: data.recallReason,
      recall_classification: data.classification,
      pharmacy_name: data.pharmacyName,
      recall_summary: summary,
    };

    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey as string,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: agentId,
            agent_phone_number_id: phoneNumberId,
            to_number: toNumber,
            conversation_initiation_client_data: {
              dynamic_variables: vars,
              conversation_config_override: {
                agent: {
                  first_message: (data.recallNumber.startsWith("DEMO-") ? "This is a MediCall demonstration, not a real medication recall. " : "") + renderScript(OUTREACH_FIRST_MESSAGE, vars),
                  prompt: { prompt: renderScript(OUTREACH_SYSTEM_PROMPT, vars) + (data.recallNumber.startsWith("DEMO-") ? "\nThis entire call is a fictional demo. Never claim the FDA actually recalled this medication; do not instruct medication changes based on this simulation." : "") + (approved?.script ? "\nPharmacist-approved discussion plan:\n" + approved.script : "\nNo alternative has been approved. Do not recommend a replacement.") + `\nAuthoritative case facts for THIS call (use these exact values and no others): ${summary}. Never mention any other medication as the patient's prescription.` },
                },
              },
            },
          }),
        },
      );

      const bodyText = await response.text();

      if (!response.ok) {
        console.error(`ElevenLabs outbound call failed [${response.status}]: ${bodyText}`);
        return {
          ok: false,
          message: response.status === 404
            ? "The configured ElevenLabs voice agent or calling number could not be found. Connect a real agent and an imported Twilio calling number from the same ElevenLabs account before trying again."
            : `The calling service refused the call (${response.status}). ${bodyText.slice(0, 300)}`,
        };
      }

      let conversationId: string | undefined;
      try {
        const parsed = JSON.parse(bodyText) as {
          conversation_id?: string;
          callSid?: string;
        };
        conversationId = parsed.conversation_id ?? parsed.callSid;
      } catch {
        conversationId = undefined;
      }

      return {
        ok: true,
        message: `Call requested for ${data.drugName}. ${approved?.approvedName ? "Approved option: " + approved.approvedName : "Recall notice only; no approved alternative"}. Delivery is not yet confirmed.`,
        dialed: toNumber as string,
        ...(conversationId ? { conversationId } : {}),
      };
    } catch (error) {
      console.error("ElevenLabs outbound call error", error);
      return {
        ok: false,
        message: "Could not reach the calling service. Please try again.",
      };
    }
  });

const DoctorCallInput = z.object({
  patientId: z.string().min(1),
  recallNumber: z.string().min(1),
  ndc: z.string().min(1),
});

/**
 * Notifies the patient's prescriber about the recall and about the outreach
 * call already placed to the patient. Demo mode dials the same verified test
 * number as patient calls.
 */
export const placeDoctorCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DoctorCallInput.parse(input))
  .handler(async ({ data, context }): Promise<CallResult> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("approval_status, pharmacy_name")
      .eq("id", context.userId)
      .single();
    if (profile?.approval_status !== "approved")
      return { ok: false, message: "An approved pharmacy account is required." };

    const { readStoredFeed } = await import("./recall-sync.server");
    const feed = await readStoredFeed();
    const { patient, flagged } = findCase(data.patientId, data.recallNumber, data.ndc, feed.recalls);

    const apiKey = process.env["ELEVENLABS_API_KEY"];
    const agentId = process.env["ELEVENLABS_AGENT_ID"];
    const phoneNumberId = process.env["ELEVENLABS_PHONE_NUMBER_ID"];
    const toNumber = process.env["DEMO_CALL_NUMBER"];
    if (!apiKey || !agentId || !phoneNumberId || !toNumber)
      return { ok: false, message: "Calling is not fully set up yet." };

    const isDemo = flagged.recall.recallNumber.startsWith("DEMO-");
    const doctorName = flagged.prescription.prescriber || "the prescriber";

    const docVars: Record<string, string> = {
      doctor_name: doctorName,
      patient_name: patient.fullName,
      patient_id: patient.patient.id,
      drug_name: flagged.prescription.drugName,
      recalled_medication_name: flagged.prescription.drugName,
      drug_strength: flagged.prescription.strength,
      ndc: flagged.prescription.ndc,
      recall_number: flagged.recall.recallNumber,
      recall_reason: flagged.recall.reasonForRecall,
      recall_classification: flagged.recall.classification,
      pharmacy_name: profile.pharmacy_name,
    };

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          agent_phone_number_id: phoneNumberId,
          to_number: toNumber,
          conversation_initiation_client_data: {
            dynamic_variables: docVars,
            conversation_config_override: {
              agent: {
                first_message:
                  (isDemo ? "This is a MediCall demonstration, not a real medication recall. " : "") +
                  renderScript(DOCTOR_FIRST_MESSAGE, docVars),
                prompt: {
                  prompt:
                    renderScript(DOCTOR_SYSTEM_PROMPT, docVars) +
                    (isDemo
                      ? "\nThis entire call is a fictional demo. Never claim the FDA actually recalled this medication."
                      : "") +
                    `\nAuthoritative case facts for THIS call (use these exact values and no others): patient ${patient.fullName} (${patient.patient.id}) takes ${flagged.prescription.drugName} ${flagged.prescription.strength}, NDC ${flagged.prescription.ndc}, recall ${flagged.recall.recallNumber} (${flagged.recall.classification}). Never mention any other medication.`,
                },
              },
            },
          },
        }),
      });

      const bodyText = await response.text();
      if (!response.ok) {
        console.error(`ElevenLabs prescriber call failed [${response.status}]: ${bodyText}`);
        return { ok: false, message: `The calling service refused the call (${response.status}).` };
      }

      let conversationId: string | undefined;
      try {
        conversationId = (JSON.parse(bodyText) as { conversation_id?: string }).conversation_id;
      } catch {
        conversationId = undefined;
      }

      return {
        ok: true,
        message: `Prescriber notification requested for Dr. ${doctorName}.`,
        dialed: toNumber,
        ...(conversationId ? { conversationId } : {}),
      };
    } catch (error) {
      console.error("ElevenLabs prescriber call error", error);
      return { ok: false, message: "Could not reach the calling service. Please try again." };
    }
  });
