import { createServerFn } from "@tanstack/react-start";

import type { Recall } from "@/lib/recall-matching";

export type RecallFeed = {
  recalls: Recall[];
  source: "database" | "openfda" | "fallback";
  fetchedAt: string;
  lastSyncedAt: string | null;
  /** Recall numbers first seen during this request's sync. */
  newRecallNumbers: string[];
};

/**
 * Stored FDA recall history, refreshed from openFDA when it is older than 12h.
 * The list only grows: recalls that drop out of the live feed are kept.
 */
export const getRecallFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecallFeed> => {
    const { readStoredFeed } = await import("@/lib/recall-sync.server");
    return await readStoredFeed();
  },
);
