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

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Medicall" },
      { name: "description", content: "Pharmacy staff sign in to Medicall." },
      { property: "og:title", content: "Sign in — Medicall" },
      { property: "og:description", content: "Pharmacy staff sign in to Medicall." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
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

  return (
    <AuthCard
      title="Sign in"
      subtitle="Pharmacy staff — access your recall dashboard."
      footer={
        <>
          Need an account? <AuthLink to="/signup">Register your pharmacy</AuthLink>
        </>
      }
    >
      <section className="mb-5 space-y-2 border-b pb-5">
        <h2 className="text-sm font-semibold">Riverside Pharmacy demo</h2>
        <p className="text-xs text-muted-foreground">40 demo patients · 10 affected by recalls</p>
        <dl className="text-sm">
          <div><dt className="inline font-medium">Email: </dt><dd className="inline">demo@medicall.example</dd></div>
          <div><dt className="inline font-medium">Password: </dt><dd className="inline">MedicallDemo2026!</dd></div>
        </dl>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={loading}
          onClick={() => {
            setEmail("demo@medicall.example");
            setPassword("MedicallDemo2026!");
          }}
        >
          Use demo login
        </Button>
      </section>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@pharmacy.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
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
    </AuthCard>
  );
}
