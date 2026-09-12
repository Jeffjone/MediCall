import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCallStore } from "@/lib/call-store";
import { useRouteContext } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach Log — Medicall" },
      {
        name: "description",
        content:
          "Record of AI voice outreach calls placed to patients holding recalled medications.",
      },
      { property: "og:title", content: "Outreach Log — Medicall" },
      {
        property: "og:description",
        content: "Record of AI voice outreach calls placed about medication recalls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OutreachPage,
});

function Field({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === "") return null;
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium break-words">{value}</dd>
    </div>
  );
}

function OutreachPage() {
  const { log } = useCallStore();
  const { session } = useRouteContext();

  return (
    <AppShell
      title="Outreach"
      subtitle="Audit log of every AI voice call placed from this dashboard. The log resets when the page reloads."
      session={session}
    >
      <Card>
        <CardHeader>
          <CardTitle>Call audit log ({log.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {log.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <PhoneCall className="h-6 w-6" />
              No calls placed yet. Start one from the dashboard or a patient card.
            </div>
          )}
          {log.map((entry) => (
            <div key={entry.id} className="rounded-md border p-4 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-medium">
                    {entry.patientName}{" "}
                    <span className="text-xs text-muted-foreground">({entry.patientId})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.drugName} · recall {entry.recallNumber} · started{" "}
                    {new Date(entry.startedAt).toLocaleString()}
                    {entry.completedAt
                      ? ` · resolved ${new Date(entry.completedAt).toLocaleTimeString()}`
                      : ""}
                  </div>
                </div>
                <Badge
                  variant={
                    entry.status === "failed"
                      ? "destructive"
                      : entry.status === "called"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {entry.status === "called"
                    ? "Requested"
                    : entry.status === "dialing"
                      ? "Dialing"
                      : "Failed"}
                </Badge>
              </div>

              {entry.reason && (
                <p className="mt-3 rounded bg-muted/50 p-2 text-xs">
                  <span className="font-semibold">Reason for call: </span>
                  {entry.reason}
                </p>
              )}

              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Date of birth" value={entry.patient?.dateOfBirth} />
                <Field label="Patient phone" value={entry.patient?.phone} />
                <Field label="Patient email" value={entry.patient?.email} />
                <Field label="Language" value={entry.patient?.preferredLanguage} />

                <Field label="Strength" value={entry.prescription?.strength} />
                <Field label="NDC" value={entry.prescription?.ndc} />
                <Field label="Prescriber" value={entry.prescription?.prescriber} />
                <Field label="Fill date" value={entry.prescription?.fillDate} />
                <Field label="Quantity" value={entry.prescription?.quantity} />
                <Field label="Days supply" value={entry.prescription?.daysSupply} />

                <Field label="Recall class" value={entry.recall?.classification} />
                <Field label="Recall status" value={entry.recall?.status} />
                <Field label="Recalling firm" value={entry.recall?.recallingFirm} />
                <Field label="Lot numbers" value={entry.recall?.lotNumbers} />
                <Field label="Recall initiated" value={entry.recall?.recallInitiationDate} />
                <Field label="Recalled product" value={entry.recall?.productDescription} />
                <Field label="Recall reason" value={entry.recall?.reasonForRecall} />

                <Field label="Approved alternative" value={entry.approvedAlternative} />
                <Field label="Number dialed (demo)" value={entry.dialedNumber} />
                <Field label="Conversation ID" value={entry.conversationId} />
              </dl>

              <p className="mt-3 text-xs text-muted-foreground">{entry.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
