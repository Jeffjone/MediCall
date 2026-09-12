# RecallGuard MVP — recall matching + AI outreach calls

Turn the static dashboard into a working demo: real FDA recall data, 40 demo patients, automatic NDC matching, and a real AI phone call per flagged patient.

## 1. Demo data (two files)

**Recalls** — 10 real records pulled live from the openFDA Drug Enforcement endpoint and frozen into a file in the project. Each entry keeps: recall number, product description, brand/generic name, reason for recall, classification (I/II/III), recalling firm, recall date, status, and the NDC codes parsed out of the record.

**Patients** — ~40 invented pharmacy patients. Each has name, patient ID, date of birth, phone, and one or more prescriptions (drug name, strength, NDC, prescriber, fill date, days supply). Exactly 10 carry an NDC that appears in the recall file; the other 30 carry clean NDCs.

Real openFDA records don't always list a clean NDC, so NDCs are normalised (hyphens stripped, padded to the standard 11-digit form) on both sides before comparing.

## 2. Matching

```text
recall NDC ──► normalise ──► lookup set
                                 │
patient prescription NDC ────────┤
                                 ▼
                            MATCH?
                          /        \
                       YES          NO
                        │            │
                    FLAGGED       normal
                        │
                 Contact Patient
```

A single matching module computes, for every patient, which of their prescriptions hit a recall and which recall it was. Everything on screen — the stat counts, the alert banner, the flagged rows — is derived from that result, not hardcoded.

## 3. Dashboard changes

- Stat cards show real counts from the data.
- Alert banner cycles the active Class I/II recalls.
- Patients table lists all 40, flagged rows highlighted with the recall reason, classification badge, and lot/recall number; search box filters by patient, drug, or NDC.
- Patient detail panel: full prescription list, the matched recall record, and call history.
- Recalls page: the 10 FDA records with affected-patient counts.
- Outreach page: every call placed, with status and outcome.

## 4. Real AI phone call (ElevenLabs)

Clicking **Initiate Call** places an actual outbound call using an ElevenLabs conversational agent. The agent is briefed with the patient's name, the recalled drug, the recall reason and class, and instructions to advise them to stop use and contact the pharmacy.

Important: ElevenLabs makes the AI voice agent, but placing a call to a real phone number also needs a phone number attached to that agent inside ElevenLabs (imported from Twilio or a SIP trunk). Setup on your side, before calls work:

1. An ElevenLabs account with Conversational AI enabled.
2. A phone number connected to ElevenLabs (Twilio number import is the usual route).
3. An outbound agent created in the ElevenLabs dashboard.

For the demo, every call dials one verified number you provide, no matter which patient row was clicked, so nothing reaches a real stranger. The patient's real details are still passed to the agent so the conversation is accurate.

Safeguards: confirmation dialog before dialing, per-patient call state (idle → dialing → called), errors from ElevenLabs surfaced in plain language, and a visible "demo mode — all calls dial the test number" notice.

## 5. Technical notes

- `src/data/fda-recalls.json` and `src/data/patients.json`, generated once from openFDA (`https://api.fda.gov/drug/enforcement.json`) and committed as static files — no runtime API call to the FDA.
- `src/lib/recall-matching.ts`: NDC normalisation, recall lookup map, `matchPatients()` returning flagged results; pure and unit-testable.
- ElevenLabs via the standard connector (`ELEVENLABS_API_KEY`), called server-side only from a `createServerFn` in `src/lib/outreach.functions.ts`. Client never sees the key.
- Outbound call uses the ElevenLabs Conversational AI outbound-call endpoint with the agent ID, the agent's phone number ID, the demo destination number, and dynamic variables for patient/recall context.
- Config values stored as secrets: `ELEVENLABS_AGENT_ID`, `ELEVENLABS_PHONE_NUMBER_ID`, `DEMO_CALL_NUMBER`.
- Call log kept in memory for the session (no database). Say the word if it should persist across reloads — that needs Lovable Cloud.
- New routes: `/patients`, `/recalls`, `/outreach`, each with its own page metadata.

## 6. What I need from you

- The verified phone number all demo calls should dial.
- Your ElevenLabs agent ID and phone number ID (from the ElevenLabs dashboard), once the agent and number exist.

I'll build the data, matching, and full dashboard first so it's usable immediately; the call button goes live once the ElevenLabs pieces are connected.
