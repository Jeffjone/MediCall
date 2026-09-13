import { Link, useNavigate } from "@tanstack/react-router";
import {
  Pill,
  AlertTriangle,
  Users,
  PhoneCall,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { NotificationBell } from "@/components/NotificationBell";
import { SimulateRecallButton } from "@/components/SimulateRecallButton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import type { SessionProfile } from "@/lib/profiles.functions";

const navItems = [
  { to: "/command-center", icon: Sparkles, label: "Command center" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/patients", icon: Users, label: "Patients" },
  { to: "/recalls", icon: AlertTriangle, label: "Recalls" },
  { to: "/outreach", icon: PhoneCall, label: "Outreach" },
  { to: "/profile", icon: Building2, label: "Pharmacy profile" },
] as const;

/** Camera scanner: mobile web only. */
const mobileOnlyItems = [
  { to: "/scan", icon: ScanLine, label: "Scan label" },
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
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex flex-col gap-0.5 px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold tracking-tight">Medicall</span>
              <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                Know Sooner. Act Faster.
              </span>

            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground",
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mx-3 mb-3"><SimulateRecallButton /></div>
        <div className="mx-3 mb-4 rounded-lg border border-sidebar-border px-3 py-2.5 text-[11px] leading-relaxed text-sidebar-foreground/50">
          Demo mode — all outreach calls dial one verified test number.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b bg-card px-6 py-3.5">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">Medicall</span>
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
            <NotificationBell />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition-colors hover:bg-accent"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {initials || "RX"}
              </div>
              <span className="hidden text-sm font-medium sm:inline">
                {session.pharmacyName}
              </span>
            </Link>
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

        <main className="flex-1 space-y-6 p-6 lg:p-8">
          <div className="md:hidden"><SimulateRecallButton /></div>
          <div className="space-y-1">
            <h1 className="font-display text-[1.65rem] font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

