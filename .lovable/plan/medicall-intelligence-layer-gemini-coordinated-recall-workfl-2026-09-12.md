# Medicall intelligence layer — Gemini-coordinated recall workflow

Turn the current flag-and-call demo into a full pipeline: recall detected → drug identity normalised → Gemini analyses risk, alternatives and affordability → pharmacist reviews the recommended alternative → approved plan drives a dynamically written outreach call.

```text
openFDA recalls ─► NDC match ─► RxNorm normalise (RxCUI, ingredient, class)
                                        │
                                        ▼
                         Gemini analysis (structured JSON)
                    risk · alternatives · action plan · call script
                                        │
                    simulated financial profile (Nessie-shaped)
                                        ▼
                        affordability + savings ranking
                                        ▼
                        Pharmacist reviews alternative
                              Approve / Reject
                                        ▼
                       AI voice call with the approved plan
```

## 1. Drug identity via RxNorm

Replace pure NDC string comparison with normalised identifiers. For each recalled product and each patient prescription, look up RxNorm (free, no key) to get the RxCUI, ingredient name, dose form and strength. A patient is flagged when the NDC matches **or** the ingredient/RxCUI matches a recalled product, so a reformulated or repackaged equivalent is still caught. Lookups are cached in memory per session; the existing NDC match stays as the fast path and as a fallback whenever RxNorm is unreachable.

Matches get a confidence label: exact NDC, same RxCUI, or same ingredient.

## 2. Financial profile (Nessie-shaped, simulated)

Each demo patient gets a deterministic financial profile in the same shape the Capital One Nessie API returns — monthly spending, healthcare spending, available balance, recurring prescription spend — behind a single provider module. Swapping in a real Nessie key later means replacing that one module, nothing else.

From that profile the app derives an affordability risk (Low / Medium / High) and the headroom available for a replacement medication.

## 3. Gemini as the intelligence layer

A server-side Gemini call (through Lovable AI, no key needed) receives the recall record, the RxNorm-normalised drug identity, the patient's prescription, and the financial profile. It returns one structured JSON object:

- **Risk analysis** — clinical urgency, time sensitivity, plain-language explanation of why this patient is affected.
- **Alternatives** — 3 candidate medications, each with name, RxCUI, estimated monthly cost, popularity, and why it substitutes.
- **Financial impact** — per alternative: monthly delta, annual delta, and an accessibility rating against this patient's profile.
- **Action plan** — recommended alternative plus the steps the pharmacy should take.
- **Call script** — a patient-specific first message and agent instructions, generated from everything above.

Cost figures are Gemini estimates and are labelled as estimates in the UI. They come from a pricing provider module with a single `estimatePrices()` entry point, so a real pricing API can be dropped in later without touching the analysis code.

Gemini also uses Google Search grounding so recall context and alternative suggestions reflect current information, with the sources it used shown in the UI.

## 4. Pharmacist review of the alternative

A new **Review** panel per flagged patient shows the risk summary, the ranked alternatives table, the financial snapshot, and Gemini's recommendation. The pharmacist approves or rejects the recommended alternative, or picks a different one from the table. Calls can still be placed at any time (as today); approval decides **which** alternative the call mentions. An unapproved call falls back to the current stop-and-contact-us script with no drug recommendation.

## 5. Dynamic AI call

The outreach call stops using the fixed script for approved patients. Instead it sends Gemini's generated first message and agent prompt, including the approved alternative, the estimated monthly saving, and the recall reason. The hardcoded script remains as the fallback when no analysis exists or Gemini is unavailable. Demo mode is unchanged — every call still dials the verified test number.

## 6. New surfaces

- Flagged patient rows get an **Analyse** action and a status chip: not analysed / analysed / approved.
- Patient detail gains the risk, alternatives, financial, and action-plan sections.
- Outreach log records whether the call used an approved plan and which alternative it named.

## Technical notes

- `src/lib/rxnorm.ts` — RxNorm client (`rxnav.nlm.nih.gov`, public), NDC→RxCUI, RxCUI→properties, related-ingredient lookup, in-memory cache, graceful degradation to NDC-only matching.
- `src/lib/recall-matching.ts` — extended to accept optional normalised identity and emit a match-confidence field; existing pure NDC logic preserved.
- `src/lib/financial.ts` — Nessie-shaped `getFinancialProfile(patientId)` returning deterministic simulated data, plus the affordability calculation. Single swap point for a real Nessie key.
- `src/lib/drug-pricing.ts` — `estimatePrices()` provider; current implementation delegates to Gemini, interface built for an HTTP pricing API.
- `src/lib/analysis.functions.ts` — `createServerFn` calling Gemini (`google/gemini-*` through the Lovable AI gateway) with a structured output schema and Search grounding; streams server-side so long reasoning runs don't time out. Returns the typed analysis object.
- `src/lib/analysis-store.ts` — in-memory store (same pattern as `call-store.ts`) holding analyses and approval decisions for the session; resets on reload.
- `src/lib/outreach.functions.ts` — accepts an optional approved plan and uses its generated first message/prompt as the ElevenLabs agent override; falls back to `outreach-script.ts`.
- Gateway errors (credits, rate limits) surface in the UI with the gateway's own message; nothing is silently retried.

## Out of scope for now

Real Nessie accounts, a real drug-pricing API, and persistence to the database. Everything except the AI call itself runs without extra credentials. Say the word if analyses and approvals should survive reloads — that needs database tables and an audit trail.
