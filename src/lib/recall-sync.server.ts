import type { Recall } from "@/lib/recall-matching";

export type StoredFeed = {
  recalls: Recall[];
  source: "database" | "openfda" | "fallback";
  fetchedAt: string;
  lastSyncedAt: string | null;
  newRecallNumbers: string[];
};

type Row = {
  recall_number: string;
  product_description: string;
  drug_name: string;
  ndc_codes: string[];
  lot_numbers: string;
  reason_for_recall: string;
  classification: string;
  recalling_firm: string;
  recall_initiation_date: string;
  report_date: string;
  status: string;
  distribution_pattern: string;
  city: string;
  state: string;
  first_seen_at: string;
  last_synced_at: string;
};

const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;

function toRecall(row: Row): Recall {
  return {
    recallNumber: row.recall_number,
    productDescription: row.product_description,
    drugName: row.drug_name,
    ndcCodes: row.ndc_codes ?? [],
    lotNumbers: row.lot_numbers,
    reasonForRecall: row.reason_for_recall,
    classification: row.classification,
    recallingFirm: row.recalling_firm,
    recallInitiationDate: row.recall_initiation_date,
    reportDate: row.report_date,
    status: row.status,
    distributionPattern: row.distribution_pattern,
    city: row.city,
    state: row.state,
    firstSeenAt: row.first_seen_at,
  };
}

function toRow(recall: Recall) {
  return {
    recall_number: recall.recallNumber,
    product_description: recall.productDescription,
    drug_name: recall.drugName,
    ndc_codes: recall.ndcCodes,
    lot_numbers: recall.lotNumbers,
    reason_for_recall: recall.reasonForRecall,
    classification: recall.classification,
    recalling_firm: recall.recallingFirm,
    recall_initiation_date: recall.recallInitiationDate,
    report_date: recall.reportDate,
    status: recall.status,
    distribution_pattern: recall.distributionPattern,
    city: recall.city,
    state: recall.state,
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Pull the openFDA feed and store it. Recalls never seen before are inserted
 * with a first_seen_at stamp; known ones only get their last_synced_at bumped.
 * Returns the recall numbers that were brand new in this run.
 */
export async function syncRecalls(): Promise<{ newRecallNumbers: string[]; source: "openfda" | "fallback" }> {
  const { fetchRecalls } = await import("@/lib/recalls.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { recalls, source } = await fetchRecalls();
  if (recalls.length === 0) return { newRecallNumbers: [], source };

  const { data: existing } = await supabaseAdmin
    .from("fda_recalls")
    .select("recall_number");
  const known = new Set((existing ?? []).map((r) => r.recall_number as string));

  const rows = recalls.map(toRow);
  const { error } = await supabaseAdmin
    .from("fda_recalls")
    .upsert(rows, { onConflict: "recall_number" });
  if (error) throw new Error(error.message);

  const newRecallNumbers = recalls
    .map((r) => r.recallNumber)
    .filter((n) => !known.has(n));

  return { newRecallNumbers, source };
}

/** Read the stored recall history, syncing first when it is empty or stale. */
export async function readStoredFeed(): Promise<StoredFeed> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const read = async () => {
    const { data, error } = await supabaseAdmin
      .from("fda_recalls")
      .select("*")
      .order("first_seen_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Row[];
  };

  let rows = await read();
  const lastSynced = rows.reduce<string | null>(
    (max, r) => (!max || r.last_synced_at > max ? r.last_synced_at : max),
    null,
  );
  const stale = !lastSynced || Date.now() - new Date(lastSynced).getTime() > SYNC_INTERVAL_MS;

  let newRecallNumbers: string[] = [];
  let source: StoredFeed["source"] = "database";

  if (stale) {
    try {
      const result = await syncRecalls();
      newRecallNumbers = result.newRecallNumbers;
      source = result.source;
      rows = await read();
    } catch {
      // keep whatever history we already have
    }
  }

  if (rows.length === 0) {
    const { fetchRecalls } = await import("@/lib/recalls.server");
    const live = await fetchRecalls();
    return {
      recalls: live.recalls,
      source: live.source,
      fetchedAt: new Date().toISOString(),
      lastSyncedAt: null,
      newRecallNumbers: [],
    };
  }

  return {
    recalls: rows.map(toRecall),
    source,
    fetchedAt: new Date().toISOString(),
    lastSyncedAt: lastSynced,
    newRecallNumbers,
  };
}
