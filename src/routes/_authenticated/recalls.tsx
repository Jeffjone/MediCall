import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  affectedCountByRecall,
  classificationRank,
  formatFdaDate,
  matchPatients,
} from "@/lib/recall-matching";
import { isNewSince, markRecallsViewed, readLastViewed } from "@/lib/recall-news";
import { useRecallFeed, useRouteContext } from "@/routes/_authenticated/route";


export const Route = createFileRoute("/_authenticated/recalls")({
  head: () => ({
    meta: [
      { title: "FDA Recalls — Medicall" },
      {
        name: "description",
        content:
          "Live FDA drug enforcement recalls with NDC codes, lot numbers, and the number of pharmacy patients affected.",
      },
      { property: "og:title", content: "FDA Recalls — Medicall" },
      {
        property: "og:description",
        content: "Live FDA drug enforcement recalls and affected patient counts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecallsPage,
});

function RecallsPage() {
  const { recalls, source, fetchedAt, lastSyncedAt } = useRecallFeed();
  const matched = useMemo(() => matchPatients(undefined, recalls), [recalls]);
  const counts = useMemo(() => affectedCountByRecall(matched), [matched]);
  const { session } = useRouteContext();
  const [lastViewed, setLastViewed] = useState(0);

  useEffect(() => {
    setLastViewed(readLastViewed());
    return () => markRecallsViewed();
  }, []);

  const sorted = useMemo(
    () =>
      [...recalls].sort((a, b) => {
        const newness =
          Number(isNewSince(b, lastViewed)) - Number(isNewSince(a, lastViewed));
        if (newness !== 0) return newness;
        return classificationRank(a.classification) - classificationRank(b.classification);
      }),
    [recalls, lastViewed],
  );

  const syncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : new Date(fetchedAt).toLocaleString();

  return (
    <AppShell
      title="FDA Recalls"
      subtitle={
        source === "fallback"
          ? "openFDA is unreachable right now, showing the last bundled snapshot. Matching is done on NDC."
          : `${recalls.length} recalls tracked from the openFDA Drug Enforcement (RES) API. Checked automatically every 12 hours — last check ${syncedLabel}. Matching is done on NDC.`
      }
      session={session}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {sorted.map((recall) => {
          const affected = counts.get(recall.recallNumber) ?? 0;
          const isNew = isNewSince(recall, lastViewed);
          return (
            <Card key={recall.recallNumber} className={isNew ? "ring-2 ring-primary/40" : undefined}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">
                    {recall.drugName}
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    {isNew && <Badge>NEW</Badge>}
                    <Badge
                      variant={recall.classification === "Class I" ? "destructive" : "secondary"}
                    >
                      {recall.classification}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {recall.recallNumber} · {recall.recallingFirm} · {recall.city},{" "}
                  {recall.state}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{recall.reasonForRecall}</p>
                <div className="flex flex-wrap gap-1">
                  {recall.ndcCodes.map((ndc) => (
                    <span
                      key={ndc}
                      className="rounded border bg-muted px-2 py-0.5 font-mono text-xs"
                    >
                      {ndc}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lots: {recall.lotNumbers || "not specified"}
                </p>
                {recall.firstSeenAt && (
                  <p className="text-xs text-muted-foreground">
                    Added to Medicall {new Date(recall.firstSeenAt).toLocaleString()}
                  </p>
                )}

                <a
                  href={`https://api.fda.gov/drug/enforcement.json?search=recall_number:%22${encodeURIComponent(recall.recallNumber)}%22`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  View official FDA record
                  <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex items-center justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground">
                    Initiated {formatFdaDate(recall.recallInitiationDate)} · {recall.status}
                  </span>
                  <span
                    className={
                      affected > 0
                        ? "inline-flex items-center gap-1 font-medium text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {affected > 0 && <AlertTriangle className="h-3 w-3" />}
                    {affected} patient{affected === 1 ? "" : "s"} affected
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
