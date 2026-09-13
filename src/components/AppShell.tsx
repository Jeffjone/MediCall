import { Link, useNavigate } from "@tanstack/react-router";
import {
  ClipboardList,
  AlertTriangle,
  Users,
  PhoneCall,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  ScanLine,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { NotificationBell } from "@/components/NotificationBell";
import { SimulateRecallButton } from "@/components/SimulateRecallButton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import type { SessionProfile } from "@/lib/profiles.functions";
import { clearSimulatedRecalls } from "@/lib/simulate-recall.functions";

const navItems = [
  { to: "/command-center", icon: Sparkles, label: "Command center" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/analyses", icon: ClipboardList, label: "Analyses" },
  { to: "/patients", icon: Users, label: "Patients" },
  { to: "/recalls", icon: AlertTriangle, label: "Recalls" },
  { to: "/outreach", icon: PhoneCall, label: "Outreach" },
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
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const base = isMobile ? [...navItems, ...mobileOnlyItems] : [...navItems];
  const items = session.role === "admin"
    ? [...base, { to: "/admin", icon: ShieldCheck, label: "Admin" } as const]
    : base;

  async function handleSignOut() {
    // Reset the demo: drop any simulated recalls so the feed is back to FDA-only.
    try {
      await clearSimulatedRecalls();
    } catch {
      // Non-blocking — never trap the user in a signed-in state.
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
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
            <BrandMark className="h-9 w-9" />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold tracking-tight">MediCall</span>
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
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b bg-card/95 px-4 py-2.5 backdrop-blur md:flex md:gap-4 md:px-6 md:py-3.5">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[17rem] bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="px-5 py-5 text-left">
                <SheetTitle className="flex items-center gap-2.5 text-sidebar-foreground">
                  <BrandMark className="h-9 w-9" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-display text-lg font-bold tracking-tight">MediCall</span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                      Know Sooner. Act Faster.
                    </span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-3">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60"
                    activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 px-3"><SimulateRecallButton /></div>
              <div className="mx-3 mt-3 rounded-lg border border-sidebar-border px-3 py-2.5 text-[11px] leading-relaxed text-sidebar-foreground/50">
                Demo mode — all outreach calls dial one verified test number.
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <BrandMark className="h-7 w-7" />
            <span className="truncate font-display font-bold">MediCall</span>
          </div>

          <div className="flex items-center gap-1 md:ml-auto md:gap-2">
            <NotificationBell />
            <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
            <Link
              to="/profile"
              aria-label="Pharmacy profile"
              className="flex items-center gap-2 rounded-full border p-1 transition-colors hover:bg-accent md:px-2.5 md:py-1.5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {initials || "RX"}
              </div>
              <span className="hidden text-sm font-medium md:inline">
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

        <main className="flex-1 space-y-5 px-4 py-5 md:space-y-6 md:p-6 lg:p-8">
          <div className="space-y-1">
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-[1.65rem]">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

