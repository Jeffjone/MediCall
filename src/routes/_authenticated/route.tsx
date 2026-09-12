import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMySession } from "@/lib/profiles.functions";
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
      const session = await getMySession({ data: {} });
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
        },
      };
    }
  },
  component: AuthLayout,
});

export const useRouteContext = Route.useRouteContext;

function AuthLayout() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();

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
