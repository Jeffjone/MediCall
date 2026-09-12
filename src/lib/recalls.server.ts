import fallbackRecalls from "@/data/fda-recalls.json";
import type { Recall } from "@/lib/recall-matching";

const OPENFDA_ENDPOINT = "https://api.fda.gov/drug/enforcement.json";

/**
 * Recall numbers used by the demo patient fixture. They are pinned so the
 * demo always resolves against the real openFDA record for that recall,
 * even after it scrolls out of the "most recent" feed.
 */
const PINNED_RECALL_NUMBERS = [
  "D-0771-2026",
  "D-0733-2026",
  "D-0745-2026",
  "D-0709-2026",
  "D-0758-2026",
  "D-0742-2026",
  "D-0712-2026",
  "D-0732-2026",
  "D-0661-2026",
  "D-0654-2026",
];

const NDC_PATTERN = /\b\d{4,5}-\d{3,4}-\d{1,2}\b/g;

const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: { at: number; data: Recall[] } | null = null;

type OpenFdaRecord = {
  recall_number?: string;
  product_description?: string;
  reason_for_recall?: string;
  classification?: string;
  recalling_firm?: string;
  recall_initiation_date?: string;
  report_date?: string;
  status?: string;
  distribution_pattern?: string;
  city?: string;
  state?: string;
  code_info?: string;
};

/** Pull the NDC package codes out of the free-text product description. */
function extractNdcCodes(description: string): string[] {
  const found = description.match(NDC_PATTERN) ?? [];
  return Array.from(new Set(found));
}

/** First clause of the product description is the trade/generic drug name. */
function deriveDrugName(description: string): string {
  const firstClause = description.split(",")[0] ?? description;
  return firstClause.trim().slice(0, 90);
}

function toRecall(record: OpenFdaRecord): Recall | null {
  const description = record.product_description?.trim();
  const recallNumber = record.recall_number?.trim();
  if (!description || !recallNumber) return null;

  const ndcCodes = extractNdcCodes(description);
  if (ndcCodes.length === 0) return null;

  return {
    recallNumber,
    productDescription: description,
    drugName: deriveDrugName(description),
    ndcCodes,
    lotNumbers: record.code_info?.trim() ?? "",
    reasonForRecall: record.reason_for_recall?.trim() ?? "",
    classification: record.classification?.trim() ?? "Class III",
    recallingFirm: record.recalling_firm?.trim() ?? "",
    recallInitiationDate: record.recall_initiation_date ?? "",
    reportDate: record.report_date ?? "",
    status: record.status ?? "",
    distributionPattern: record.distribution_pattern ?? "",
    city: record.city ?? "",
    state: record.state ?? "",
  };
}

async function queryOpenFda(search: string, limit: number, sort?: string): Promise<OpenFdaRecord[]> {
  const params = new URLSearchParams({ search, limit: String(limit) });
  if (sort) params.set("sort", sort);

  const response = await fetch(`${OPENFDA_ENDPOINT}?${params.toString()}`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) return []; // openFDA returns 404 for "no matches"
    throw new Error(`openFDA request failed with ${response.status}`);
  }

  const body = (await response.json()) as { results?: OpenFdaRecord[] };
  return body.results ?? [];
}

/**
 * Live FDA drug enforcement (RES) recalls: the pinned demo recalls plus the
 * most recently reported drug recalls that carry a parseable NDC.
 */
export async function fetchRecalls(): Promise<{ recalls: Recall[]; source: "openfda" | "fallback" }> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { recalls: cache.data, source: "openfda" };
  }

  try {
    const pinnedQuery = PINNED_RECALL_NUMBERS.map((n) => `recall_number:"${n}"`).join("+OR+");

    const [pinned, latest] = await Promise.all([
      queryOpenFda(pinnedQuery, PINNED_RECALL_NUMBERS.length),
      queryOpenFda('product_type:"Drugs"', 100, "report_date:desc"),
    ]);

    const byNumber = new Map<string, Recall>();
    for (const record of [...pinned, ...latest]) {
      const recall = toRecall(record);
      if (recall && !byNumber.has(recall.recallNumber)) {
        byNumber.set(recall.recallNumber, recall);
      }
    }

    const merged = Array.from(byNumber.values()).slice(0, 60);
    if (merged.length === 0) throw new Error("openFDA returned no usable recalls");

    cache = { at: Date.now(), data: merged };
    return { recalls: merged, source: "openfda" };
  } catch {
    return { recalls: fallbackRecalls as Recall[], source: "fallback" };
  }
}
