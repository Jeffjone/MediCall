<div align="center">

MediCall
Know Sooner. Act Faster.
An AI-assisted pharmacy recall-response platform that connects FDA safety data to the patients who need to know.

Live Demo · Repository · openFDA

Built for the HackRice 16 Healthcare Track.

</div>

What is MediCall?
Medication recalls create an operational problem for pharmacies: a recall notice identifies a product, but the pharmacy still has to determine which prescriptions match, find the affected patients, review the case, and reach those patients quickly.

MediCall turns that process into one workflow. It ingests FDA drug-enforcement recalls, normalizes and matches NDCs against pharmacy prescription records, surfaces affected patients, and gives pharmacy staff AI-assisted tools to investigate and coordinate outreach. A pharmacist remains in control of consequential actions.

The project uses synthetic patient data for demonstration purposes. It is hackathon software and is not intended for clinical use.

Core workflow
flowchart LR
    A[openFDA Drug Recalls] --> B[Recall Sync]
    B --> C[NDC Normalization & Matching]
    D[Synthetic Patient + Rx Data] --> C
    C --> E[Pharmacy Dashboard]
    E --> F[Gemini Command Center]
    E --> G[Mobile Label Scanner]
    F --> H[Pharmacist Review]
    G --> C
    H --> I[ElevenLabs Voice Agent]
    I --> J[Twilio Outbound Call]
    J --> K[Patient / Prescriber Demo Number]
Features
FDA recall monitoring and deterministic NDC matching
MediCall maintains a stored recall feed from openFDA Drug Enforcement data and automatically checks for updates every 12 hours. If openFDA is unavailable, the app can fall back to its bundled recall snapshot so the core workflow remains demonstrable.

Prescription NDCs and recall NDCs are normalized into a common form before matching. Patients whose active prescriptions match a tracked recall are surfaced throughout the dashboard, patient records, and recall views. Lot information is shown for pharmacist verification rather than treating an NDC match as final clinical confirmation.

Gemini Command Center
The Command Center is not a standalone chatbot. Gemini acts as the orchestration layer for the application, using tool calls to inspect and operate MediCall's workflows from natural language.

It can:

summarize dashboard activity;

check and refresh recalls;

search patients and affected prescriptions;

inspect specific recall records;

review refill/dispensing patterns;

run medication/allergy interaction checks against FDA-label evidence;

prepare case analyses for pharmacist review;

prepare patient or prescriber outreach;

display the current outreach log;

create and clear fictional demo recalls; and

inspect pharmacy account information.

Multi-step requests can be executed sequentially while keeping pharmacist approval gates in front of outreach and medication-related decisions.

Model: Google Gemini 3.1 Pro Preview, streamed through the Vercel AI SDK / Lovable AI gateway.

Mobile medication label scanner
The mobile-only scanner turns a phone camera into a medication intake tool. A pharmacist can photograph a prescription or OTC label and MediCall extracts structured fields such as:

medication and generic name;

strength and dosage form;

NDC;

lot number and expiration date;

quantity;

manufacturer;

prescription number, prescriber, and directions when visible.

Gemini is instructed to transcribe only information actually visible in the image. The parsed result is schema-validated and immediately checked against the stored recall feed. Exact NDC matches are distinguished from weaker drug-name-only matches.

Model: Google Gemini 3.8 Flash with multimodal image input.

AI voice outreach
For a flagged prescription, pharmacy staff can review the case and explicitly confirm outreach. MediCall then sends authoritative case variables to an ElevenLabs Conversational AI agent, which initiates an outbound call through its Twilio integration.

The demo is intentionally constrained:

calls go to a single verified demo number rather than synthetic patient phone numbers;

fictional DEMO- recalls are announced as simulations;

the voice agent is grounded in the selected patient, drug, NDC, recall number, classification, and recall reason; and

pharmacist-approved discussion information is passed only when a matching approval exists.

Patient outreach can be followed by a prescriber call from the same workflow.

Patient workspace and pharmacy analytics
MediCall provides a searchable patient workspace with prescription histories and recall status. Additional demo workflows include refill-history analysis, medication/allergy interaction visualization, saved pharmacist reviews, and an outreach audit view for the active browser session.

Recall simulator
A fictional recall can be injected into the same matching pipeline used for FDA records. Simulated recalls use a DEMO- identifier and are clearly separated from real FDA data, making it possible to demonstrate the full detection-to-outreach workflow without misrepresenting a real medication as recalled.

Pharmacy authentication and approvals
MediCall uses Supabase authentication for pharmacy accounts. New pharmacy registrations include pharmacy and pharmacist information, and the first registered account acts as the administrator for later account approvals. Protected features require an approved account.

Architecture
                         ┌──────────────────────┐
                         │       openFDA        │
                         │ Drug Enforcement API │
                         └──────────┬───────────┘
                                    │
                           scheduled / manual sync
                                    │
                                    ▼
┌──────────────────┐      ┌──────────────────────┐
│ Synthetic Patient │─────▶│ Recall Matching      │
│ + Prescription DB │      │ NDC normalization    │
└─────────┬────────┘      └──────────┬───────────┘
          │                           │
          │                           ▼
          │                 ┌──────────────────────┐
          └────────────────▶│ Supabase + App State │
                            └──────────┬───────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │ Pharmacy UI     │ │ Gemini Command  │ │ Mobile Scanner  │
          │ React/TanStack  │ │ Center + Tools  │ │ Gemini Vision   │
          └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                   │                   │                   │
                   └───────────────────┴───────────────────┘
                                       │
                              pharmacist confirmation
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ ElevenLabs Agent │
                              └────────┬─────────┘
                                       │ Twilio
                                       ▼
                              ┌──────────────────┐
                              │ Outbound Demo Call│
                              └──────────────────┘
Tech stack
Layer	Technology	Role
Frontend	React 19, TypeScript, Tailwind CSS 4, Radix UI	Pharmacy dashboard and responsive UI
App framework	TanStack Start + TanStack Router + Vite	Full-stack routing, SSR/server functions, build tooling
Data & auth	Supabase	Authentication, pharmacy profiles, persisted analyses and interaction results
AI orchestration	Google Gemini + Vercel AI SDK	Command Center reasoning, tool calling, streamed responses
Multimodal AI	Gemini 3.8 Flash	Medication-label image extraction
Recall source	openFDA Drug Enforcement API	Real FDA recall records
Voice AI	ElevenLabs Conversational AI	Scripted, case-grounded pharmacy outreach
Telephony	Twilio via ElevenLabs	Outbound demo calls
Validation	Zod	Runtime validation of tool and AI-generated structured data
Visualization	Recharts + custom React components	Dashboard metrics and medication interaction views
Database tooling	Drizzle ORM / Drizzle Kit	PostgreSQL schema and migration tooling
Development	Lovable + GitHub	Rapid development, deployment, and source synchronization
Why Gemini matters to MediCall
Gemini is used in two distinct ways:

Agentic orchestration: the Command Center receives natural-language objectives, selects application tools, works through multi-step workflows, and returns live UI results rather than only generating prose.

Multimodal extraction: the label scanner converts a medication photo into validated structured data that can be passed into the deterministic recall-matching engine.

The design deliberately separates AI reasoning from deterministic safety-critical checks. NDC matching, account authorization, call confirmation, and approval validation are handled by application logic; Gemini coordinates and explains the workflow around those controls.

Safety and demo boundaries
MediCall was designed as a hackathon prototype with explicit guardrails:

Patient records are synthetic/demo data, not real PHI.

FDA feeds may include historical records; recall status and affected lots must still be verified.

An NDC match is a screening signal, not a clinical determination.

Gemini is instructed not to prescribe, claim an alternative is clinically approved, or tell a patient to stop medication unconditionally.

Medication-related analyses require pharmacist review.

The Command Center can prepare outreach, but the user must individually confirm calls.

Outbound calls use a verified demo number rather than fake patient numbers.

Simulated recalls are clearly labeled and must never be represented as FDA recalls.

Demo
Live app: https://medicallhack.lovable.app/

The deployed app includes a public Riverside Pharmacy demo account:

Email:    demo@medicall.example
Password: MediCallDemo2026!
The demo workspace contains 40 synthetic patients, including patients intentionally matched to recalls so the end-to-end workflow can be demonstrated.

A useful demo sequence is:

Open the dashboard and review current FDA recall matches.

Ask the Command Center to check recalls and identify affected patients.

Inspect a flagged patient's prescription and recall details.

On a phone, use Label Scanner to photograph a medication label and check it against the recall feed.

Prepare outreach in the Command Center or patient workflow.

Confirm a demo AI call and show the resulting outreach entry.

Optionally create a fictional recall with the simulator to demonstrate the full pipeline without relying on a live recall event.

Local development
Prerequisites
Node.js 20+ recommended

npm (or Bun)

Supabase project / credentials

Google AI or Lovable AI access for Gemini-powered features

ElevenLabs Conversational AI + a configured Twilio-backed phone number for outbound calling

Install
git clone https://github.com/Jeffjone/MediCall.git
cd MediCall
npm install
npm run dev
Vite will print the local development URL in the terminal.

Environment variables
Configure secrets locally or through your deployment platform. Do not commit production credentials.

# Supabase — browser + server
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=

# Gemini
# Direct Google AI access is supported by Gemini helper functions.
GOOGLE_AI_API_KEY=
# The current Command Center route also expects Lovable AI gateway access.
LOVABLE_API_KEY=

# ElevenLabs / Twilio outbound calling
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_PHONE_NUMBER_ID=
DEMO_CALL_NUMBER=

# Optional: Drizzle migration connection
LOVABLE_DB_MIGRATION_URL=
Useful scripts
npm run dev       # start Vite in development mode
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # ESLint
npm run format    # Prettier
Project structure
MediCall/
├── drizzle/                  # Drizzle schema / migrations
├── public/                   # Static assets
├── src/
│   ├── components/           # Dashboard, review, graph and UI components
│   ├── integrations/
│   │   └── supabase/         # Supabase client, auth middleware and types
│   ├── lib/                  # Recall matching, Gemini, scanner, outreach, analyses
│   └── routes/
│       ├── _authenticated/   # Dashboard, patients, recalls, scan, outreach, etc.
│       └── api/              # Command Center and server API routes
├── supabase/                 # Supabase project assets / migrations
├── tests/                    # Regression and application tests
├── package.json
└── roadmap.md
Product philosophy
MediCall is built around a simple idea: automation should shorten the path from a safety signal to a human response without removing the healthcare professional from the decision.

The system automates data gathering, matching, organization, and communication preparation. Pharmacists remain responsible for clinical judgment and for authorizing patient-facing actions.

<div align="center">

MediCall — Know Sooner. Act Faster.

HackRice 2026 · Healthcare Track

</div>

