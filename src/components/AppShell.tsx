import { Link, useNavigate } from "@tanstack/react-router";
import {
  Pill,
  AlertTriangle,
  Users,
  PhoneCall,
  LayoutDashboard,
  Bell,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import type { SessionProfile } from "@/lib/profiles.functions";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/patients", icon: Users, label: "Patients" },
  { to: "/recalls", icon: AlertTriangle, label: "Recalls" },
  { to: "/outreach", icon: PhoneCall, label: "Outreach" },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
  session,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  session: SessionProfile;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const items = session.role === "admin"
    ? [...navItems, { to: "/admin", icon: ShieldCheck, label: "Admin" } as const]
    : navItems;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = session.pharmacyName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex flex-col gap-0.5 px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight">Medicall</span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Know Sooner. Act Faster.
              </span>
            </div>
          </div>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-primary/10 text-primary" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 pb-4 text-xs text-muted-foreground">
          Demo mode — all outreach calls dial one verified test number.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b bg-card px-6 py-4">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </div>
            <span className="font-semibold">Medicall</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground"
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials || "RX"}
              </div>
              <span className="hidden text-sm font-medium sm:inline">
                {session.pharmacyName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
