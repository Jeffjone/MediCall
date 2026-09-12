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

function OutreachPage() {
  const { log } = useCallStore();
  const { session } = useRouteContext();

  return (
    <AppShell
      title="Outreach"
      subtitle="AI voice calls placed from this dashboard. The log resets when the page reloads."
      session={session}
    >
      <Card>
        <CardHeader>
          <CardTitle>Call history ({log.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {log.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <PhoneCall className="h-6 w-6" />
              No calls placed yet. Start one from the dashboard or a patient card.
            </div>
          )}
          {log.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-1 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium">{entry.patientName}</div>
                <div className="text-xs text-muted-foreground">
                  {entry.drugName} · recall {entry.recallNumber} ·{" "}
                  {new Date(entry.startedAt).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{entry.detail}</div>
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
                  ? "Completed"
                  : entry.status === "dialing"
                    ? "Dialing"
                    : "Failed"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
