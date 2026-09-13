import { CalendarClock, ChevronDown, Pill, TrendingUp } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Patient } from "@/lib/recall-matching";
import { patientRefillSummary } from "@/lib/refill-tracking";

export function RefillTracker({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);
  const summary = patientRefillSummary(patient);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Refill tracking</span>
            <Badge variant="secondary">{summary.totalFills} fills</Badge>
            {summary.earlyRefillCount > 0 && (
              <Badge variant="outline">{summary.earlyRefillCount} early</Badge>
            )}
            {summary.extraPillsRequested > 0 && (
              <Badge variant="destructive">
                <TrendingUp className="mr-1 h-3 w-3" />+{summary.extraPillsRequested} extra pills
              </Badge>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              {open ? "Hide history" : "View history"}
              <ChevronDown
                className={`ml-1 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-3 space-y-3">
          {summary.histories.map((h) => (
            <div key={h.prescription.ndc} className="rounded-md border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                    {h.prescription.drugName} {h.prescription.strength}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {h.fillCount} fills · every {h.averageIntervalDays ?? "—"} days on average
                    {" · "}
                    {h.expectedIntervalDays}-day supply prescribed
                  </p>
                </div>
                {h.isOverutilized ? (
                  <Badge variant="destructive">Above expected use</Badge>
                ) : (
                  <Badge variant="secondary">On schedule</Badge>
                )}
              </div>

              <ul className="mt-3 space-y-1.5">
                {h.events
                  .slice()
                  .reverse()
                  .map((e, i) => (
                    <li
                      key={`${e.date}-${i}`}
                      className="flex flex-wrap items-center justify-between gap-2 border-t pt-1.5 text-xs first:border-t-0 first:pt-0"
                    >
                      <span className="font-mono">{e.date}</span>
                      <span className="text-muted-foreground">
                        {e.quantity} dispensed
                        {e.extraPills > 0 && (
                          <span className="text-destructive">
                            {" "}
                            (+{e.extraPills} beyond the {h.prescription.quantity} prescribed)
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {e.intervalDays === null
                          ? "first recorded fill"
                          : e.daysEarly > 0
                            ? `${e.intervalDays} days later · ${e.daysEarly} days early`
                            : `${e.intervalDays} days later`}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Demo dispensing history. Early refills and extra quantities are shown for pharmacist
            review, not as a clinical judgement.
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
