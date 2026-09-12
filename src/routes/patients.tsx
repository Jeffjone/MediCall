import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { InitiateCallButton } from "@/components/InitiateCallButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { matchPatients, type MatchedPatient } from "@/lib/recall-matching";

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "Patients — Medicall" },
      {
        name: "description",
        content:
          "Every pharmacy patient with their prescriptions, NDC codes, and recall status at a glance.",
      },
      { property: "og:title", content: "Patients — Medicall" },
      {
        property: "og:description",
        content: "Pharmacy patients with prescriptions, NDC codes, and recall status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientsPage,
});

type SortKey = "name-asc" | "name-desc" | "flagged-first" | "flagged-last";
type FilterKey = "all" | "flagged" | "clear" | "flagged-class1" | "flagged-class2";

const sortOptions: Record<SortKey, { label: string; compare: (a: MatchedPatient, b: MatchedPatient) => number }> = {
  "name-asc": {
    label: "Name (A–Z)",
    compare: (a, b) => a.fullName.localeCompare(b.fullName),
  },
  "name-desc": {
    label: "Name (Z–A)",
    compare: (a, b) => b.fullName.localeCompare(a.fullName),
  },
  "flagged-first": {
    label: "Flagged first",
    compare: (a, b) => Number(b.isFlagged) - Number(a.isFlagged) || a.fullName.localeCompare(b.fullName),
  },
  "flagged-last": {
    label: "Flagged last",
    compare: (a, b) => Number(a.isFlagged) - Number(b.isFlagged) || a.fullName.localeCompare(b.fullName),
  },
};

function matchesFilter(m: MatchedPatient, filter: FilterKey): boolean {
  switch (filter) {
    case "flagged":
      return m.isFlagged;
    case "clear":
      return !m.isFlagged;
    case "flagged-class1":
      return m.flagged.some((f) => f.recall.classification === "Class I");
    case "flagged-class2":
      return m.flagged.some((f) => f.recall.classification === "Class II");
    case "all":
    default:
      return true;
  }
}

function PatientsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [filter, setFilter] = useState<FilterKey>("all");
  const matched = useMemo(() => matchPatients(), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matched
      .filter((m) => matchesFilter(m, filter))
      .filter((m) => {
        if (!q) return true;
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.patient.id.toLowerCase().includes(q) ||
          m.patient.prescriptions.some(
            (p) => p.drugName.toLowerCase().includes(q) || p.ndc.includes(q),
          )
        );
      })
      .sort(sortOptions[sort].compare);
  }, [matched, query, filter, sort]);

  return (
    <AppShell
      title="Patients"
      subtitle="All patients on file. Rows shaded red hold at least one recalled medication."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, medications, or NDC…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <SelectTrigger className="h-9 w-[190px]" aria-label="Filter patients">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All patients</SelectItem>
              <SelectItem value="flagged">Show flagged only</SelectItem>
              <SelectItem value="clear">Show clear only</SelectItem>
              <SelectItem value="flagged-class1">Flagged — Class I</SelectItem>
              <SelectItem value="flagged-class2">Flagged — Class II</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[170px]" aria-label="Sort patients">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z–A)</SelectItem>
              <SelectItem value="flagged-first">Flagged first</SelectItem>
              <SelectItem value="flagged-last">Flagged last</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">{visible.length} patients</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((m) => (
          <Card
            key={m.patient.id}
            className={m.isFlagged ? "border-destructive/40 bg-destructive/5" : ""}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{m.fullName}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {m.patient.id} · DOB {m.patient.dateOfBirth} · {m.patient.phone}
                  </p>
                </div>
                {m.isFlagged ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Recalled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Clear</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {m.patient.prescriptions.map((p) => {
                const flagged = m.flagged.find((f) => f.prescription.ndc === p.ndc);
                return (
                  <div
                    key={p.ndc}
                    className="rounded-md border bg-background p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">
                          {p.drugName} {p.strength}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          NDC {p.ndc}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.prescriber} · filled {p.fillDate} · {p.daysSupply}-day supply
                        </div>
                      </div>
                      {flagged && (
                        <Badge variant="destructive" className="shrink-0">
                          {flagged.recall.classification}
                        </Badge>
                      )}
                    </div>
                    {flagged && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        <p className="text-xs text-muted-foreground">
                          {flagged.recall.recallNumber}: {flagged.recall.reasonForRecall}
                        </p>
                        <InitiateCallButton match={m} flagged={flagged} />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
