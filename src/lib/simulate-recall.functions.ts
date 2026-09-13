import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { matchPatients, patients, type Recall } from "./recall-matching";

export const simulateRecall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase.from("profiles").select("approval_status").eq("id", context.userId).single();
    if (profile?.approval_status !== "approved") throw new Error("An approved pharmacy account is required.");
    const { readStoredFeed } = await import("./recall-sync.server");
    const feed = await readStoredFeed();
    const matched = matchPatients(patients, feed.recalls);
    const prescription = matched.find(p => !p.isFlagged)?.patient.prescriptions[0];
    if (!prescription) throw new Error("All demo patients are already flagged; no unaffected medication remains.");
    const now = new Date().toISOString();
    const date = now.slice(0, 10).replaceAll("-", "");
    const recall: Recall = {
      recallNumber: `DEMO-${crypto.randomUUID()}`,
      drugName: prescription.drugName,
      productDescription: `SIMULATED RECALL — ${prescription.drugName} ${prescription.strength}. Fictional demo data, not an FDA recall.`,
      ndcCodes: [prescription.ndc],
      lotNumbers: "DEMO-LOT-001",
      reasonForRecall: "DEMO ONLY: simulated quality-control failure detected during routine testing. Not an actual FDA recall.",
      classification: "Class II",
      recallingFirm: "Medicall Demo Manufacturer (fictional)",
      recallInitiationDate: date, reportDate: date,
      status: "Demo simulation", distributionPattern: "Demo pharmacy only",
      city: "Chicago", state: "IL", firstSeenAt: now,
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("fda_recalls").insert({
      recall_number: recall.recallNumber, drug_name: recall.drugName,
      product_description: recall.productDescription, ndc_codes: recall.ndcCodes,
      lot_numbers: recall.lotNumbers, reason_for_recall: recall.reasonForRecall,
      classification: recall.classification, recalling_firm: recall.recallingFirm,
      recall_initiation_date: date, report_date: date, status: recall.status,
      distribution_pattern: recall.distributionPattern, city: recall.city, state: recall.state,
      first_seen_at: now, last_synced_at: feed.lastSyncedAt ?? now,
    });
    if (error) throw new Error("Could not save the simulated recall. Please try again.");
    return { recall, filename: `${recall.recallNumber}.json`, json: JSON.stringify(recall, null, 2) };
  });