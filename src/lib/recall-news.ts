import type { Recall } from "@/lib/recall-matching";

const SEEN_KEY = "medicall.recalls.seen";
const VIEWED_KEY = "medicall.recalls.lastViewed";

function readSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSeen(numbers: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(numbers.slice(-500)));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Recall numbers in `recalls` that this browser has never seen before.
 * On the very first run the whole list is recorded silently (returns []).
 */
export function collectUnseenRecalls(recalls: Recall[]): Recall[] {
  const seen = readSeen();
  const all = recalls.map((r) => r.recallNumber);

  if (seen.length === 0) {
    writeSeen(all);
    return [];
  }

  const known = new Set(seen);
  const unseen = recalls.filter((r) => !known.has(r.recallNumber));
  if (unseen.length > 0) writeSeen([...seen, ...unseen.map((r) => r.recallNumber)]);
  return unseen;
}

/** Timestamp of the last visit to the recalls page. */
export function readLastViewed(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(VIEWED_KEY);
  return raw ? Number(raw) : 0;
}

export function markRecallsViewed() {
  try {
    window.localStorage.setItem(VIEWED_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/** True when the recall was stored after the given visit timestamp. */
export function isNewSince(recall: Recall, since: number): boolean {
  if (!since || !recall.firstSeenAt) return false;
  return new Date(recall.firstSeenAt).getTime() > since;
}
