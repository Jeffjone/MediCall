# Keep the recall list updating automatically

Today the recall list is fetched fresh from the FDA each time the workspace loads, and nothing is remembered between visits — so there is no way to tell which recalls are genuinely new. This adds a stored, growing recall history plus an automatic twice-daily check and a popup whenever a new recall shows up.

## What changes for you

- **Stored recall history.** Every recall Medicall has ever seen from the FDA feed is saved. The list only grows; nothing disappears when the FDA feed rolls over.
- **Automatic check every 12 hours.** A background job pulls the FDA feed twice a day, even when nobody has the site open, and adds anything new.
- **Popup alert for every new recall.** When new recalls arrive, a toast pops up on screen ("3 new FDA recalls added"), with extra emphasis and a red styling when one of them matches a patient's medication. Clicking it opens the recalls page.
- **"New" badges.** Recalls added since your last visit are marked NEW on the recalls page, and each card shows when it was first seen.
- **Notification bell.** Every new recall also lands in the bell, so nothing is missed if the popup is dismissed.
- No manual refresh button, as requested.

## How it works

### Database

New table `fda_recalls`, keyed on `recall_number`, holding all the fields the app already uses (drug name, NDC codes, lots, classification, firm, reason, status, dates, distribution) plus `first_seen_at` and `last_synced_at`. Readable by any signed-in pharmacy account; writes only from the server. GRANTs issued alongside RLS in the same migration.

### Sync

- `syncRecalls()` server helper: fetches openFDA (existing `recalls.server.ts` logic, pinned demo recalls included), upserts every record, and returns the list of recall numbers that were inserted for the first time.
- Public cron route `src/routes/api/public/hooks/sync-recalls.ts` (POST, token-checked) calls the sync; scheduled with pg_cron at `0 */12 * * *` — two runs per day, minimal cost, worst-case 12-hour delay before a new recall appears, which matches the cadence you chose.
- The authenticated layout loader reads recalls from the database instead of calling openFDA directly, so pages render instantly from stored history. It also opportunistically triggers a sync if the last one is older than 12 hours, so a live session never sees stale data.

### New-recall detection in the UI

The client keeps the timestamp of the last time you viewed recalls. On load, any recall whose `first_seen_at` is later than that gets a NEW badge, feeds the notification bell, and triggers a single toast (sonner) summarising the count. While a session stays open, the layout re-checks the stored feed every 12 hours so a long-running session also pops the toast.

### Files touched

- new migration: `fda_recalls` table, grants, RLS
- new `src/lib/recall-sync.server.ts` (upsert + new-detection)
- new `src/routes/api/public/hooks/sync-recalls.ts` (cron endpoint)
- `src/lib/recalls.functions.ts` / `recalls.server.ts` — read from DB, fall back to the live fetch then the bundled snapshot
- `src/routes/_authenticated/route.tsx` — periodic refresh + toast trigger
- `src/routes/_authenticated/recalls.tsx` — NEW badge, first-seen date
- `src/lib/notifications.ts` — new-recall entries ordered by first-seen
- `src/routes/__root.tsx` — mount `<Toaster />` if not already present

Matching, outreach, analysis and the command center keep working unchanged; they simply read a recall list that now grows over time.
