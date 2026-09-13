import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, ShieldCheck, Building2 } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/lib/app-errors";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPendingProfiles, setApprovalStatus } from "@/lib/profiles.functions";
import { useRouteContext } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — MediCall" },
      {
        name: "description",
        content: "Approve pending pharmacy registrations on MediCall.",
      },
      { property: "og:title", content: "Admin — MediCall" },
      { property: "og:description", content: "Approve pending pharmacy registrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: ({ context }) => {
    if (context.session?.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const { session } = useRouteContext();
  const fetchPending = useServerFn(listPendingProfiles);
  const approve = useServerFn(setApprovalStatus);
  const queryClient = useQueryClient();

  const { data: pending = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pending-profiles"],
    queryFn: () => fetchPending(),
  });

  async function handleAction(profileId: string, status: "approved" | "rejected") {
    try {
      await approve({ data: { profileId, status } });
      toast.success(
        status === "approved"
          ? "Pharmacy approved — they can now sign in."
          : "Pharmacy registration rejected.",
      );
      await queryClient.invalidateQueries({ queryKey: ["pending-profiles"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update approval status.",
      );
    }
  }

  return (
    <AppShell
      title="Admin"
      subtitle="Review and approve pharmacy registrations before they can access MediCall."
      session={session}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending registrations ({pending.length})</CardTitle>
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {isError && <div role="alert" className="space-y-3 py-8 text-center text-sm text-destructive"><p>{errorMessage(error)}</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></div>}
          {!isLoading && !isError && pending.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Check className="h-6 w-6" />
              No pending registrations. Everyone is approved.
            </div>
          )}
          {pending.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{p.pharmacyName}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.email}
                    {p.fullName ? ` · ${p.fullName}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.pharmacyLocation || "No location"} · License{" "}
                    {p.licenseNumber || "not provided"}
                  </div>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      Registered {new Date(p.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction(p.id, "approved")}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(p.id, "rejected")}
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
