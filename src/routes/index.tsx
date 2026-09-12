import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Pill,
  AlertTriangle,
  PhoneCall,
  Users,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medicall — Know Sooner. Act Faster." },
      {
        name: "description",
        content:
          "Medicall helps pharmacies track patients on recalled medications and trigger AI outreach calls. Know Sooner. Act Faster.",
      },
      { property: "og:title", content: "Medicall — Know Sooner. Act Faster." },
      {
        property: "og:description",
        content:
          "Medicall helps pharmacies track patients on recalled medications and trigger AI outreach calls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        navigate({ to: "/dashboard", replace: true });
      }
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const features = [
    {
      icon: Users,
      title: "Patient records",
      body: "Every pharmacy patient and prescription, with NDC codes, at a glance.",
    },
    {
      icon: AlertTriangle,
      title: "Recall matching",
      body: "Prescriptions are matched against live FDA drug enforcement recalls by NDC.",
    },
    {
      icon: PhoneCall,
      title: "AI outreach",
      body: "Trigger a scripted AI voice call to alert affected patients in seconds.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
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
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Register pharmacy</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        <section className="py-16 text-center sm:py-24">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Pharmacy recall readiness
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Know Sooner.{" "}
            <span className="text-primary">Act Faster.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Medicall matches your patients' prescriptions to FDA drug recalls by NDC and
            lets your team trigger a scripted AI outreach call the moment a recall hits.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <Button size="lg">
                Register your pharmacy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
          {checking && (
            <p className="mt-4 text-xs text-muted-foreground">Checking your session…</p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
