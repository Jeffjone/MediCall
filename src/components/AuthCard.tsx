import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Pill, ArrowLeft } from "lucide-react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label="MediCall home"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
          >
            <Pill className="h-6 w-6" />
          </Link>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-2xl font-bold tracking-tight text-sidebar-foreground">
              MediCall
            </span>
            <span className="mt-1 text-sm text-sidebar-foreground/50">
              Pharmacy recall-readiness workspace
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-8 shadow-2xl">
          <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && (
            <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
        <p className="mt-8 text-center text-xs text-sidebar-foreground/40">
          Know Sooner. Act Faster. · Secure pharmacy access
        </p>
      </div>
    </div>
  );
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-primary hover:underline">
      {children}
    </Link>
  );
}
