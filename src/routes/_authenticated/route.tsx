import { createFileRoute, Outlet, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMySession } from "@/lib/profiles.functions";
import { getRecallFeed } from "@/lib/recalls.functions";
import { setRecalls, matchPatients } from "@/lib/recall-matching";
import { collectUnseenRecalls } from "@/lib/recall-news";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    try {
      const session = await getMySession();
      return { session };
    } catch {
      // Profile not built yet (e.g. trigger lag). Treat as pending.
      return {
        session: {
          userId: data.user.id,
          email: data.user.email ?? "",
          pharmacyName: "Unregistered Pharmacy",
          pharmacyLocation: null,
          licenseNumber: null,
          fullName: null,
          approvalStatus: "pending" as const,
          role: "staff" as const,
          phone: null,
          streetAddress: null,
          city: null,
          state: null,
          postalCode: null,
          npiNumber: null,
          deaNumber: null,
          hours: null,
          notes: null,
        },
      };
    }
  },
  loader: async () => {
    const feed = await getRecallFeed();
    setRecalls(feed.recalls);
    return feed;
  },
  component: AuthLayout,
});

export const useRouteContext = Route.useRouteContext;

/** Live openFDA recall feed loaded once for the whole authenticated area. */
export function useRecallFeed() {
  return Route.useLoaderData();
}

export function useRecalls() {
  return Route.useLoaderData().recalls;
}

function AuthLayout() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const { recalls } = Route.useLoaderData();

  // Re-check the stored FDA feed twice a day for long-running sessions.
  useEffect(() => {
    const id = window.setInterval(
      () => {
        router.invalidate();
      },
      12 * 60 * 60 * 1000,
    );
    return () => window.clearInterval(id);
  }, [router]);

  // Pop an alert for every recall this browser has not seen before.
  useEffect(() => {
    const unseen = collectUnseenRecalls(recalls);
    if (unseen.length === 0) return;

    const matched = matchPatients(undefined, unseen);
    const affected = matched.filter((m) => m.isFlagged).length;
    const label =
      unseen.length === 1
        ? `New FDA recall — ${unseen[0]!.drugName}`
        : `${unseen.length} new FDA recalls added`;

    const show = affected > 0 ? toast.error : toast.info;
    show(label, {
      description:
        affected > 0
          ? `${affected} of your patient${affected === 1 ? "" : "s"} may be affected. Review now.`
          : "Added to your recall list from the FDA feed.",
      duration: 12000,
      action: {
        label: "View recalls",
        onClick: () => navigate({ to: "/recalls" }),
      },
    });
  }, [recalls, navigate]);



  if (session.approvalStatus !== "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <CardTitle>Account pending approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Thanks for registering, {session.pharmacyName}. Our team is reviewing
              your pharmacy license information before activating your account.
            </p>
            <p>
              You’ll get access to Medicall as soon as your account is approved.
              Contact your account administrator if you have questions.
            </p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth", replace: true });
              }}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Sign out
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
