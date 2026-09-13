import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Users,
  PhoneCall,
  Activity,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { InitiateCallButton } from "@/components/InitiateCallButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallStore } from "@/lib/call-store";
import {
  classificationRank,
  formatFdaDate,
  getStats,
  matchPatients,
} from "@/lib/recall-matching";
import { useRecalls, useRouteContext } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MediCall" },
      {
        name: "description",
        content:
          "MediCall live view of patients prescribed FDA-recalled medications, matched by NDC, with one-click AI outreach calls.",
      },
      { property: "og:title", content: "Dashboard — MediCall" },
      {
        property: "og:description",
        content:
          "Live view of patients prescribed FDA-recalled medications, matched by NDC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [query, setQuery] = useState("");
  const { byPatient } = useCallStore();
  const { session } = useRouteContext();

  const recalls = useRecalls();
  const matched = useMemo(() => matchPatients(undefined, recalls), [recalls]);
  const stats = useMemo(() => getStats(matched, recalls), [matched, recalls]);
  const demoCount = recalls.filter(r => r.recallNumber.startsWith("DEMO-")).length;

  const affected = useMemo(
    () =>
      matched
        .filter((m) => m.isFlagged)
        .filter((m) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            m.fullName.toLowerCase().includes(q) ||
            m.patient.id.toLowerCase().includes(q) ||
            m.flagged.some(
              (f) =>
                f.prescription.drugName.toLowerCase().includes(q) ||
                f.prescription.ndc.includes(q) ||
                f.recall.recallNumber.toLowerCase().includes(q),
            )
          );
        }),
    [matched, query],
  );

  const topRecall = useMemo(
    () =>
      [...recalls].sort(
        (a, b) => classificationRank(a.classification) - classificationRank(b.classification),
      )[0],
    [recalls],
  );

  const cards = [
    { icon: Users, label: "Active Patients", value: stats.totalPatients, hint: "in the pharmacy record" },
    { icon: AlertTriangle, label: "Tracked Recalls", value: stats.totalRecalls, hint: `${stats.totalRecalls - demoCount} FDA · ${demoCount} demo` },
    { icon: Activity, label: "Patients Affected", value: stats.affectedPatients, hint: "matched to a recall" },
    { icon: PhoneCall, label: "Calls Placed", value: Object.values(byPatient).filter((s) => s === "called").length, hint: "this session" },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Patient matches across FDA recalls and clearly labeled demo simulations."
      session={session}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{c.value}</div>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {topRecall && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {topRecall.classification} recall — {topRecall.drugName} (
                {topRecall.recallNumber})
              </p>
              <p className="text-sm text-muted-foreground">
                {topRecall.reasonForRecall}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {topRecall.recallingFirm} · reported {formatFdaDate(topRecall.reportDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Flagged patients ({affected.length})</CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, NDC, or recall…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Recalled medication</TableHead>
                  <TableHead>Matched NDC</TableHead>
                  <TableHead>Recall</TableHead>
                  <TableHead>Outreach</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affected.map((m) =>
                  m.flagged.map((f) => (
                    <TableRow
                      key={`${m.patient.id}-${f.prescription.ndc}`}
                      className="bg-destructive/5"
                    >
                      <TableCell>
                        <div className="font-medium">{m.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.patient.id} · {m.patient.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{f.prescription.drugName}</div>
                        <div className="text-xs text-muted-foreground">
                          {f.prescription.strength} · filled {f.prescription.fillDate}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {f.prescription.ndc}
                      </TableCell>
                      <TableCell>
                        {f.recall.recallNumber.startsWith("DEMO-") && <Badge variant="outline" className="mr-1">DEMO</Badge>}
                        <Badge variant="destructive" className="whitespace-nowrap">

                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {f.recall.classification}
                        </Badge>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {f.recall.recallNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <OutreachBadge status={byPatient[m.patient.id] ?? "idle"} />
                          {byDoctor[m.patient.id] === "called" && (
                            <Badge variant="outline" className="whitespace-nowrap">Doctor notified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-px whitespace-nowrap py-3 text-right align-middle">
                        <InitiateCallButton match={m} flagged={f} />
                      </TableCell>

                    </TableRow>
                  )),
                )}
                {affected.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No flagged patients match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

export function OutreachBadge({ status }: { status: string }) {
  if (status === "called") return <Badge variant="outline">Called</Badge>;
  if (status === "dialing") return <Badge variant="outline">Dialing…</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}
