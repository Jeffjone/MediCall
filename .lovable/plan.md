# MediCall — Demo Script & Tech Stack Walkthrough

A spoken-order script naming every tool, framework, and service as it comes into play.

## 1. Foundation (what the site runs on)

"MediCall is a full-stack **React 19** app built on **TanStack Start v1** with **TanStack Router** for file-based routing, bundled by **Vite 8**, written in **TypeScript**, and deployed to a **Cloudflare Workers** edge runtime via **Nitro**."

- React 19 + TypeScript
- TanStack Start (SSR + server functions) / TanStack Router (routes in `src/routes`)
- TanStack Query (data caching, retry policy in `src/router.tsx`)
- Vite 8 build, Nitro → Cloudflare Workers deploy
- ESLint + Prettier, `tsgo` typechecking, Vitest for unit tests

## 2. Design layer (what you see)

"The interface is **Tailwind CSS v4** with **shadcn/ui** components on **Radix UI** primitives, **Lucide** icons, **Sonner** toasts, **Recharts** for charts, and a custom **HTML Canvas** geometric backdrop on the homepage."

- Tailwind v4 (tokens in `src/styles.css`), shadcn/ui + Radix, lucide-react
- sonner (alerts), recharts, react-hook-form + zod (forms/validation)
- `GeometricBackdrop.tsx` — canvas animation

## 3. Accounts and access

"Authentication and the database run on **Lovable Cloud**, which is **Supabase** underneath — **Postgres** with **Row Level Security**, email/password plus **Google OAuth**, pharmacy profiles, a separate roles table, and an admin approval workflow. Schema changes ship as **Drizzle** SQL migrations."

- Supabase Auth → `src/routes/auth.tsx`, `signup.tsx`, `reset-password.tsx`
- Route gate: `src/routes/_authenticated/route.tsx`
- Tables: `profiles`, `user_roles`, `fda_recalls`, `saved_analyses`, `patient_interaction_checks`, `ai_briefings` — all RLS-protected
- Drizzle Kit migrations in `drizzle/migrations`

## 4. Recall data pipeline

"Live recall data comes from the **openFDA Drug Enforcement API**, authenticated with an openFDA API key, normalized and stored in Postgres, and refreshed every 12 hours by **pg_cron + pg_net** hitting a protected webhook route."

- `src/lib/recalls.server.ts` (fetch/normalize), `recall-sync.server.ts` (persist)
- Cron target: `src/routes/api/public/hooks/sync-recalls.ts`
- New-record detection + notifications: `recall-news.ts`, `notifications.ts`
- Demo control: `SimulateRecallButton` → `simulate-recall.server.ts`

## 5. Matching engine (the core MVP logic)

"FDA recall NDC is normalized and compared against each patient's prescription NDC. A match flags the patient; no match is normal."

- `src/lib/recall-matching.ts` — NDC normalization + flagging
- Demo fixtures: `src/data/fda-recalls.json`, `src/data/patients.json` (40 patients, 10 matched)
- `src/lib/refill-tracking.ts` — deterministic demo dispensing history, early-refill/overuse detection

## 6. AI layer (Lovable AI Gateway)

"All AI runs through the **Lovable AI Gateway** using the **Vercel AI SDK** — no user-supplied keys."

- Clinical case analysis — `analysis.server.ts` (structured output via zod schemas)
- Drug-interaction checks — `interactions.server.ts`, openFDA label data + **RxNorm**, rendered as an interactive SVG graph
- Daily briefing / FDA pulse — `briefing.server.ts`, cached in `ai_briefings`
- Mobile label scanner — `scan.functions.ts`, Gemini vision on a camera photo
- Command Center — `src/routes/api/command.ts`, streaming chat with `useChat` (`@ai-sdk/react`), tool calling via `command-tools.server.ts`, `stepCountIs` step limits

## 7. Outreach (the action)

"Confirmed outbound calls go to **ElevenLabs Conversational AI**, which dials through an imported **Twilio** number. The script is hardcoded server-side and per-call variables are injected with `conversation_config_override`."

- `src/lib/outreach.functions.ts`, `outreach-script.ts`
- Patient call, then prescriber (doctor) call unlocked after first contact
- All demo calls dial one verified test number; every call is written to the audit log on `/outreach`

## 8. Agent integrations

"The app also exposes a read-only **MCP server** so external AI agents can query recalls and patients, with OAuth consent handled through Lovable Cloud."

- `src/routes/mcp.ts`, `src/lib/mcp/tools/*`, `@lovable.dev/mcp-js`

## 9. Reliability

"Errors are classified centrally — gateway 402/429/5xx, network drops, timeouts, stale chunks — with safe user-facing messages, capped retries on reads only, CSRF middleware on server functions, and a rendered fallback error page."

- `src/lib/app-errors.ts`, `src/start.ts`, `src/server.ts`, root error boundary in `__root.tsx`

## 10. Demo walkthrough order (say it in this sequence)

1. Homepage — branding, AI FDA recall pulse, canvas backdrop
2. Sign in with the demo pharmacy account (Supabase Auth, approval-gated)
3. Dashboard — live counts, flagged patients, interaction-risk flags, AI daily briefing
4. Recalls — live openFDA feed, paginated 20/page, links to official FDA records
5. Simulate New Recall — watch the alert, notification, and flags propagate
6. Patients — search/sort/filter, flagged-only, refill tracking
7. Analyse a flagged patient — AI case analysis, pharmacist review, save it
8. Analyses page — reopen a saved analysis, generate the interaction graph
9. Initiate Call — confirm, ElevenLabs + Twilio dials, then Call Doctor
10. Outreach — full audit log of the call
11. Command Center — do all of the above in natural language
12. Mobile — scan a bottle label with the camera
