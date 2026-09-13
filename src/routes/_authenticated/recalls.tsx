import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
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
      { title: "FDA Recalls — MediCall" },
      {
        name: "description",
        content:
          "Live FDA drug enforcement recalls with NDC codes, lot numbers, and the number of pharmacy patients affected.",
      },
      { property: "og:title", content: "FDA Recalls — MediCall" },
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
  const [page, setPage] = useState(1);
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
        const demoOrder = Number(b.recallNumber.startsWith("DEMO-")) - Number(a.recallNumber.startsWith("DEMO-"));
        if (demoOrder !== 0) return demoOrder;
        if (a.recallNumber.startsWith("DEMO-")) return (b.firstSeenAt ?? "").localeCompare(a.firstSeenAt ?? "");
        return classificationRank(a.classification) - classificationRank(b.classification);
      }),
    [recalls, lastViewed],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / 20));
  const currentPage = Math.min(page, pageCount);
  const visible = sorted.slice((currentPage - 1) * 20, currentPage * 20);
  useEffect(() => { setPage(1); }, [recalls.length]);

  const syncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : new Date(fetchedAt).toLocaleString();

  return (
    <AppShell
      title="FDA Recalls"
      subtitle={
        source === "fallback"
          ? "openFDA is unreachable right now, showing the last bundled snapshot. Matching is done on NDC."
          : `${recalls.filter(r => !r.recallNumber.startsWith("DEMO-")).length} FDA recalls and ${recalls.filter(r => r.recallNumber.startsWith("DEMO-")).length} demo simulations tracked. Checked automatically every 12 hours — last check ${syncedLabel}. Matching is done on NDC.`
      }
      session={session}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((recall) => {
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
                    {recall.recallNumber.startsWith("DEMO-") && <Badge variant="outline">DEMO</Badge>}
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
                    Added to MediCall {new Date(recall.firstSeenAt).toLocaleString()}
                  </p>
                )}

                {!recall.recallNumber.startsWith("DEMO-") && <a
                  href={`https://api.fda.gov/drug/enforcement.json?search=recall_number:%22${encodeURIComponent(recall.recallNumber)}%22`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  View official FDA record
                  <ExternalLink className="h-3 w-3" />
                </a>}
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
      <nav aria-label="Recall pagination" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground">{sorted.length ? (currentPage - 1) * 20 + 1 : 0}–{Math.min(currentPage * 20, sorted.length)} of {sorted.length} recalls</p>
        <div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Previous recall page" disabled={currentPage === 1} onClick={() => { setPage(currentPage - 1); window.scrollTo({ top: 0 }); }}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm">Page {currentPage} of {pageCount}</span><Button variant="outline" size="icon" aria-label="Next recall page" disabled={currentPage === pageCount} onClick={() => { setPage(currentPage + 1); window.scrollTo({ top: 0 }); }}><ChevronRight className="h-4 w-4" /></Button></div>
      </nav>
    </AppShell>
  );
}
