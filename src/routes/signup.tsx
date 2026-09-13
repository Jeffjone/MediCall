import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard, AuthLink } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Register your pharmacy — MediCall" },
      {
        name: "description",
        content: "Register your pharmacy on MediCall to track recalled medications.",
      },
      { property: "og:title", content: "Register — MediCall" },
      { property: "og:description", content: "Register your pharmacy on MediCall." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    pharmacyName: "",
    pharmacyLocation: "",
    licenseNumber: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            pharmacy_name: form.pharmacyName,
            pharmacy_location: form.pharmacyLocation,
            license_number: form.licenseNumber,
            full_name: form.fullName,
          },
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  if (done) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent a confirmation link to finish setting up your pharmacy."
      >
        <p className="text-sm text-muted-foreground">
          Click the link in the email we sent to <strong>{form.email}</strong>, then
          sign in. Your account starts in <strong>pending</strong> status until an
          administrator approves your pharmacy license information.
        </p>
        <Button className="mt-4 w-full" onClick={() => navigate({ to: "/auth" })}>
          Back to sign in
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Register your pharmacy"
      subtitle="Pharmacy details are reviewed before access is granted."
      footer={
        <>
          Already have an account? <AuthLink to="/auth">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pharmacyName">Pharmacy name</Label>
          <Input id="pharmacyName" required value={form.pharmacyName} onChange={set("pharmacyName")} placeholder="Riverside Pharmacy" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pharmacyLocation">Pharmacy ID / location</Label>
            <Input id="pharmacyLocation" value={form.pharmacyLocation} onChange={set("pharmacyLocation")} placeholder="Store #42, Chicago IL" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licenseNumber">Pharmacy license #</Label>
            <Input id="licenseNumber" value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="e.g. 1234567" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" value={form.fullName} onChange={set("fullName")} placeholder="Pharmacist name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} placeholder="you@pharmacy.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set("password")} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registering…" : "Register pharmacy"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
        Continue with Google
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        The first registered account becomes the pharmacy administrator who approves
        later registrations.
      </p>
    </AuthCard>
  );
}
