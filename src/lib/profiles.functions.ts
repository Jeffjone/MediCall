import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "admin" | "staff";

export interface SessionProfile {
  userId: string;
  email: string;
  pharmacyName: string;
  pharmacyLocation: string | null;
  licenseNumber: string | null;
  fullName: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  role: AppRole;
  phone: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  npiNumber: string | null;
  deaNumber: string | null;
  hours: string | null;
  notes: string | null;
}

/**
 * Returns the signed-in user's profile + role. Used by the protected layout
 * to decide whether to show the app, a pending screen, or redirect to sign-in.
 */
export const getMySession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, pharmacy_name, pharmacy_location, license_number, full_name, approval_status, phone, street_address, city, state, postal_code, npi_number, dea_number, hours, notes",
        )
        .eq("id", userId)
        .single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    if (profileError || rolesError) {
      throw Object.assign(new Error("Account details could not be loaded. Please try again later."), { status: 503 });
    }

    const role: AppRole =
      roles && roles.length > 0 && (roles[0] as { role: AppRole }).role === "admin"
        ? "admin"
        : "staff";

    return {
      userId,
      email: profile?.email ?? "",
      pharmacyName: profile?.pharmacy_name ?? "Unregistered Pharmacy",
      pharmacyLocation: profile?.pharmacy_location ?? null,
      licenseNumber: profile?.license_number ?? null,
      fullName: profile?.full_name ?? null,
      approvalStatus:
        (profile?.approval_status as SessionProfile["approvalStatus"]) ?? "pending",
      role,
      phone: profile?.phone ?? null,
      streetAddress: profile?.street_address ?? null,
      city: profile?.city ?? null,
      state: profile?.state ?? null,
      postalCode: profile?.postal_code ?? null,
      npiNumber: profile?.npi_number ?? null,
      deaNumber: profile?.dea_number ?? null,
      hours: profile?.hours ?? null,
      notes: profile?.notes ?? null,
    } satisfies SessionProfile;
  });

const optionalText = z.string().trim().max(500).optional().nullable();

/** Update the signed-in pharmacy's own profile details. */
export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        pharmacyName: z.string().trim().min(1).max(200),
        fullName: optionalText,
        pharmacyLocation: optionalText,
        licenseNumber: optionalText,
        phone: optionalText,
        streetAddress: optionalText,
        city: optionalText,
        state: optionalText,
        postalCode: optionalText,
        npiNumber: optionalText,
        deaNumber: optionalText,
        hours: optionalText,
        notes: z.string().trim().max(2000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const empty = (v: string | null | undefined) => (v ? v : null);

    const { error } = await supabase
      .from("profiles")
      .update({
        pharmacy_name: data.pharmacyName,
        full_name: empty(data.fullName),
        pharmacy_location: empty(data.pharmacyLocation),
        license_number: empty(data.licenseNumber),
        phone: empty(data.phone),
        street_address: empty(data.streetAddress),
        city: empty(data.city),
        state: empty(data.state),
        postal_code: empty(data.postalCode),
        npi_number: empty(data.npiNumber),
        dea_number: empty(data.deaNumber),
        hours: empty(data.hours),
        notes: empty(data.notes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface PendingProfile {
  id: string;
  email: string;
  pharmacyName: string;
  pharmacyLocation: string | null;
  licenseNumber: string | null;
  fullName: string | null;
  createdAt: string;
}

/** Admin-only: list profiles awaiting approval. */
export const listPendingProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data } = await supabase
      .from("profiles")
      .select("id, email, pharmacy_name, pharmacy_location, license_number, full_name, created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });

    return (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      pharmacyName: row.pharmacy_name,
      pharmacyLocation: row.pharmacy_location,
      licenseNumber: row.license_number,
      fullName: row.full_name,
      createdAt: row.created_at,
    })) as PendingProfile[];
  });

/** Admin-only: approve or reject a pharmacy profile. */
export const setApprovalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input) =>
      z
        .object({
          profileId: z.string().uuid(),
          status: z.enum(["approved", "rejected"]),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: data.status })
      .eq("id", data.profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
