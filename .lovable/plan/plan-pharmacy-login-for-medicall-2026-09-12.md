# Plan: Pharmacy Login for Medicall

## Recommendation

Use **Lovable Cloud** — the integrated backend built on Supabase. It provides authentication (email/password, Google, and more), a PostgreSQL database, row-level security, and server-side functions, all wired into the TanStack Start app with no external accounts or setup. It is the right fit because this project already runs on TanStack Start and needs stored profiles, roles, and per-pharmacy data scoping — exactly what Cloud gives you out of the box.

Other options considered and rejected:
- **Auth0 / Clerk** — third-party SaaS with separate accounts, billing, and a client-only session model that fights TanStack Start's SSR + server-function architecture.
- **Hand-rolled JWT auth** — reinvents password hashing, email verification, OAuth, and session refresh; no real upside over Cloud.

## What gets built

### 1. Enable Lovable Cloud
Enable Cloud, which provisions a Supabase project and the generated client integration (`@/integrations/supabase/*`), the managed `_authenticated` route gate, and bearer-token `functionMiddleware` in `src/start.ts`. Call `enable_email_auth` (email/password is off by default) and `configure_social_auth` for Google in the same turn as the first signup/signin code.

### 2. Database schema
Two tables, each with GRANT + RLS:

**`profiles`** (one row per auth user)
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pharmacy_name text not null,
  pharmacy_location text,            -- pharmacy ID / location
  license_number text,               -- pharmacy license # entered at signup
  full_name text,
  email text,
  approval_status text not null default 'pending'  -- pending | approved | rejected
  created_at timestamptz default now()
);
```
- Auto-create a `profiles` row on signup via a trigger on `auth.users`.
- RLS: a user can read/update only their own profile; admins can read all.

**`user_roles`** (separate table — never roles on profiles, per security rules)
```sql
create type public.app_role as enum ('admin', 'staff');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
```
- `has_role(_user_id, _role)` SECURITY DEFINER function for policies.

### 3. Pharmacy license # approval flow
Because the user selected **Pharmacy license #** as a sign-in requirement, signup collects the pharmacy name, location, and license number. New accounts start as `approval_status = 'pending'`. The first approved account (or a seeded admin) becomes an `admin` and can approve/reject pending pharmacies from an admin page. Pending users who log in see a "Your account is pending approval" screen instead of the dashboard.

### 4. Auth pages (public routes)
- `/auth` — sign in (email/password + Google), and a link to sign up.
- `/auth/signup` — collect email, password, pharmacy name, pharmacy location, license #, full name. Calls `supabase.auth.signUp` with `emailRedirectTo: window.location.origin`; writes profile fields into `profiles` via a trigger or a server function after confirmation.
- `/auth/forgot-password` — calls `resetPasswordForEmail`.
- `/reset-password` — public recovery page; checks `type=recovery`, calls `updateUser({ password })`.
- `/auth/callback` — public OAuth return for Google; waits for session, then redirects to `/dashboard` (or pending screen).

### 5. Protected routes
Move `index.tsx`, `patients.tsx`, `recalls.tsx`, `outreach.tsx` under `src/routes/_authenticated/` so the managed gate (redirects to `/auth`) protects them. Keep a public landing at `src/routes/index.tsx` (session-aware: redirect to `/dashboard` if signed in, else show a sign-in CTA). Signed-in home is `/dashboard`.

### 6. Session-aware AppShell header
Replace the static "Riverside Pharmacy / RP" block in `src/components/AppShell.tsx` with the real session: show the signed-in pharmacy name and a sign-out affordance; show "Sign in" when logged out. Sign-out follows the four-step cache-teardown sequence.

### 7. Admin approval page
`/_authenticated/admin` (gated by `has_role('admin')`): lists pending pharmacies with license #, approve/reject buttons. Approving sets `approval_status = 'approved'` and grants the `staff` role.

## Technical details
- Email confirmation is on by default → `signUp()` does not sign the user in; show "check your email" state. If the user wants immediate signup sign-in, we enable `auto_confirm_email` first.
- Google sign-in uses `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` — never raw `supabase.auth.signInWithOAuth`.
- Profile/license fields are written through a server function after the session exists, or via a Postgres trigger on `auth.users` insert using `new.*` raw values passed in `signUp` options metadata.
- Server functions that read/write per-pharmacy data use `requireSupabaseAuth` so RLS applies as the signed-in user.

## Out of scope
- Real outbound call changes (ElevenLabs stays as-is).
- Per-pharmacy patient data scoping (current demo data is shared) — noted for a later phase.
