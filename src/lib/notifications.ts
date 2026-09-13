import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecalls } from "@/routes/_authenticated/route";

import {
  affectedCountByRecall,
  classificationRank,
  formatFdaDate,
  matchPatients,
  recalls,
  type Recall,
} from "@/lib/recall-matching";

export type NotificationKind = "recall" | "affected" | "outreach";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  href: "/recalls" | "/patients" | "/outreach";
};

const STORAGE_KEY = "medicall.notifications.read";

/** Derive the notification feed from recall + patient matching data. */
export function buildNotifications(recallFeed: Recall[] = recalls): AppNotification[] {
  const matched = matchPatients(undefined, recallFeed);
  const counts = affectedCountByRecall(matched);
  const items: AppNotification[] = [];

  const sorted = [...recallFeed].sort((a, b) => {
    const seen = (b.firstSeenAt ?? "").localeCompare(a.firstSeenAt ?? "");
    if (seen !== 0) return seen;
    const rank = classificationRank(a.classification) - classificationRank(b.classification);
    if (rank !== 0) return rank;
    return b.reportDate.localeCompare(a.reportDate);
  });


  for (const recall of sorted) {
    const affected = counts.get(recall.recallNumber) ?? 0;
    items.push({
      id: `recall:${recall.recallNumber}`,
      kind: "recall",
      title: `${recall.recallNumber.startsWith("DEMO-") ? "DEMO · " : ""}${recall.classification} recall — ${recall.drugName}`,
      body: `${recall.recallNumber} · ${recall.reasonForRecall}`,
      timestamp: formatFdaDate(recall.reportDate),
      severity: recall.classification === "Class I" ? "critical" : "warning",
      href: "/recalls",
    });

    if (affected > 0) {
      items.push({
        id: `affected:${recall.recallNumber}`,
        kind: "affected",
        title: `${affected} patient${affected === 1 ? "" : "s"} affected by ${recall.drugName}`,
        body: `Matched by NDC to recall ${recall.recallNumber}. Review and start outreach.`,
        timestamp: formatFdaDate(recall.reportDate),
        severity: "critical",
        href: "/patients",
      });
    }
  }

  const totalAffected = matched.filter((m) => m.isFlagged).length;
  if (totalAffected > 0) {
    items.push({
      id: "outreach:pending",
      kind: "outreach",
      title: `${totalAffected} patients awaiting outreach`,
      body: "AI calls have not been confirmed for every flagged patient.",
      timestamp: "Now",
      severity: "info",
      href: "/outreach",
    });
  }

  return items;
}

function readStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useNotifications() {
  const feed = useRecalls();
  const notifications = useMemo(() => buildNotifications(feed), [feed]);
  const [read, setRead] = useState<string[]>([]);

  useEffect(() => {
    setRead(readStored());
  }, []);

  const persist = useCallback((next: string[]) => {
    setRead(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }, []);

  const markRead = useCallback(
    (id: string) => {
      if (read.includes(id)) return;
      persist([...read, id]);
    },
    [read, persist],
  );

  const markAllRead = useCallback(() => {
    persist(notifications.map((n) => n.id));
  }, [notifications, persist]);

  const unreadCount = notifications.filter((n) => !read.includes(n.id)).length;

  return { notifications, read, unreadCount, markRead, markAllRead };
}
