import { createServerFn } from "@tanstack/react-start";

import type { Recall } from "@/lib/recall-matching";

export type RecallFeed = {
  recalls: Recall[];
  source: "openfda" | "fallback";
  fetchedAt: string;
};

/** Fetches live drug recalls from the openFDA Drug Enforcement (RES) API. */
export const getRecallFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecallFeed> => {
    const { fetchRecalls } = await import("@/lib/recalls.server");
    const { recalls, source } = await fetchRecalls();
    return { recalls, source, fetchedAt: new Date().toISOString() };
  },
);
