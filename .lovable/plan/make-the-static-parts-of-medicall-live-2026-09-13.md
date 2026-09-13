# Make the static parts of MediCall live

Two places currently show fixed, hand-written text that never changes. Both become live, backed by the real recall feed and written by Gemini.

## 1. Homepage — real numbers and a recall pulse

Today the homepage shows three fixed blurbs and no data at all.

Changes:
- A small stats strip under the headline, filled from the live recall feed: total recalls tracked, patients flagged, Class I recalls, and when the feed last refreshed. Numbers come from the same matching logic the dashboard uses, so they always agree.
- A "Recall pulse" card: two or three sentences from Gemini summarising the newest recalls in the feed — what was recalled, why, and how urgent. Written for a general visitor, no jargon.
- While loading, the strip shows placeholders and the pulse shows a short skeleton; if the feed or AI is unavailable the page falls back to the existing static blurbs rather than showing an error.
- The pulse is cached so repeat visitors and page reloads don't re-run the model: one summary per recall-feed state, refreshed only when the feed changes.

Fictional `DEMO-` recalls are excluded from the homepage pulse so the public page only ever describes real FDA records.

## 2. Dashboard — AI daily briefing

A briefing card at the top of the dashboard, above the stat cards.

Gemini gets the current picture — flagged patient count, the recalls involved and their classes, how many patients are still uncontacted, how many have refill overuse, how many have a recorded interaction risk — and writes a short shift briefing: what changed since the last sync, and the two or three patients or recalls to handle first, named.

Rules it follows:
- Never recommends a medication change, never approves anything, never says a patient is safe.
- Only describes patients and recalls present in the data it is given.
- Ends with the existing pharmacist-review framing.

The card has a refresh button, shows the time it was generated, and is cached per pharmacy so it isn't regenerated on every dashboard visit. If AI is unavailable the card quietly hides and the dashboard works exactly as it does now.

## Left as-is

The simulated financial/affordability profile and the demo dispensing history stay unchanged and keep their "simulated demo data" labels, as you chose. The hardcoded call script also stays hardcoded.

## Technical notes

- New server function `src/lib/briefing.functions.ts` with two handlers: a public `getRecallPulse` (no auth middleware, so the public homepage and prerender are safe) and an authenticated `getDailyBriefing` using `requireSupabaseAuth` plus the existing approved-profile check.
- Model: `google/gemini-3.8-flash` through the Lovable AI gateway with `@ai-sdk/openai-compatible`, matching the pattern already used in `src/lib/interactions.server.ts`. Structured output via `Output.object` with a small zod schema (`headline`, `body`, `priorities[]`).
- Shared prompt-building and caching helper in `src/lib/briefing.server.ts`. Cache key is a hash of the feed state (recall count + `lastSyncedAt`) for the pulse, and of the flagged-case set for the briefing; stored in a new `ai_briefings` table with RLS (`GRANT` to `authenticated` and `service_role`; public pulse rows readable by `anon` via a narrow `SELECT` policy).
- Homepage consumes the pulse with `useQuery` in the component (not a route loader) so the public route still prerenders without hitting the database.
- Dashboard renders a new `src/components/DailyBriefing.tsx` above the stat grid, reusing the existing `matched`/`stats` values already computed in `dashboard.tsx`.
- Gateway failures follow the existing error semantics: 402/403 surface the gateway message, other statuses fall back to the static content.
