import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMyProfile } from "@/lib/profiles.functions";
import { useRouteContext } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Pharmacy Profile — Medicall" },
      {
        name: "description",
        content:
          "Update your pharmacy's contact details, licensing information, and hours in Medicall.",
      },
      { property: "og:title", content: "Pharmacy Profile — Medicall" },
      {
        property: "og:description",
        content: "Manage pharmacy contact, licensing, and hours details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useRouteContext();
  const router = useRouter();
  const save = useServerFn(updateMyProfile);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    pharmacyName: session.pharmacyName ?? "",
    fullName: session.fullName ?? "",
    pharmacyLocation: session.pharmacyLocation ?? "",
    licenseNumber: session.licenseNumber ?? "",
    phone: session.phone ?? "",
    streetAddress: session.streetAddress ?? "",
    city: session.city ?? "",
    state: session.state ?? "",
    postalCode: session.postalCode ?? "",
    npiNumber: session.npiNumber ?? "",
    deaNumber: session.deaNumber ?? "",
    hours: session.hours ?? "",
    notes: session.notes ?? "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pharmacyName.trim()) {
      toast.error("Pharmacy name is required.");
      return;
    }
    setSaving(true);
    try {
      await save({ data: form });
      await router.invalidate();
      toast.success("Pharmacy profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Pharmacy profile"
      subtitle="Keep your pharmacy's contact and licensing details up to date."
      session={session}
    >
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Pharmacy name" id="pharmacyName" value={form.pharmacyName} onChange={set} required />
              <Field label="Primary contact" id="fullName" value={form.fullName} onChange={set} />
              <Field label="Location label" id="pharmacyLocation" value={form.pharmacyLocation} onChange={set} />
              <Field label="Phone" id="phone" value={form.phone} onChange={set} />
              <Field label="Street address" id="streetAddress" value={form.streetAddress} onChange={set} className="sm:col-span-2" />
              <Field label="City" id="city" value={form.city} onChange={set} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="State" id="state" value={form.state} onChange={set} />
                <Field label="ZIP" id="postalCode" value={form.postalCode} onChange={set} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Licensing & operations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Pharmacy license number" id="licenseNumber" value={form.licenseNumber} onChange={set} />
              <Field label="NPI number" id="npiNumber" value={form.npiNumber} onChange={set} />
              <Field label="DEA number" id="deaNumber" value={form.deaNumber} onChange={set} />
              <Field label="Hours" id="hours" value={form.hours} onChange={set} placeholder="Mon–Fri 9am–7pm" />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Internal notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={4}
                  placeholder="Anything your team should know about this location."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{session.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <Badge variant="secondary" className="capitalize">{session.role}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Approval status</p>
              <Badge variant={session.approvalStatus === "approved" ? "outline" : "secondary"} className="capitalize">
                {session.approvalStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Email, role, and approval status are managed by an administrator.
            </p>
          </CardContent>
        </Card>
      </form>
    </AppShell>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  required,
  placeholder,
  className,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (key: never, value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(id as never, e.target.value)}
      />
    </div>
  );
}
