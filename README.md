<div align="center">

MediCall

Know Sooner. Act Faster.

AI-powered medication recall detection and patient outreach for pharmacies.

Live Demo · GitHub · openFDA

Built for the HackRice 2026 Healthcare Track.

</div>

Overview

When a medication is recalled, pharmacies still have to determine which patients are affected, verify the prescription, contact them, and document the response.

MediCall compresses that workflow into one system:

Ingest drug recalls from openFDA.

Normalize and match recalled NDCs against pharmacy prescription records.

Flag affected patients in the pharmacy dashboard.

Use Gemini to investigate records and orchestrate application workflows.

Contact patients through an ElevenLabs voice agent connected to Twilio.

Summarize and log outreach for pharmacy staff.

Demo note: Patient records are synthetic. MediCall is a hackathon prototype and is not intended for clinical use.

Key Features

Feature

What it does

FDA Recall Monitoring

Syncs openFDA drug-enforcement records and stores a fallback snapshot for reliable demos.

NDC Recall Matching

Normalizes recall and prescription identifiers to surface affected patients.

Gemini Command Center

Uses natural-language commands and tool calling to inspect and operate MediCall workflows.

Medication Label Scanner

Uses multimodal Gemini input to extract structured medication data from a phone photo and check it against recalls.

AI Voice Outreach

Uses ElevenLabs Conversational AI and Twilio to conduct two-way recall-notification calls.

Post-Call Intelligence

Converts call transcripts into structured summaries and follow-up information for pharmacy staff.

Recall Simulator

Injects clearly labeled fictional recalls into the same matching pipeline for safe end-to-end demos.

Pharmacy Workspace

Provides patient search, prescription history, recall status, approvals, and outreach records.

How It Works

flowchart LR
    A[openFDA Recalls] --> B[Recall Sync]
    B --> C[NDC Normalization + Matching]
    D[Synthetic Patient & Rx Data] --> C
    C --> E[Pharmacy Dashboard]

    E --> F[Gemini Command Center]
    E --> G[Medication Scanner]
    G --> C

    F --> H[Pharmacist Review]
    H --> I[ElevenLabs Conversational AI]
    I --> J[Twilio]
    J --> K[Patient Call]
    K --> L[Transcript + Follow-Up Summary]
    L --> E

Gemini's role

Gemini is used as an application intelligence layer, not just a chatbot.

Tool calling: interprets natural-language requests and invokes MediCall functions.

Multimodal extraction: converts medication-label images into validated structured data.

Post-call processing: turns unstructured conversation transcripts into concise pharmacy-facing summaries.

Deterministic application logic still handles NDC matching, permissions, approval checks, and call confirmation.

Example Workflow

A pharmacist can move from recall detection to outreach without leaving MediCall:

New FDA recall detected
        ↓
Prescription NDCs cross-referenced
        ↓
Affected patients flagged
        ↓
Pharmacist reviews patient + recall
        ↓
Gemini prepares the workflow
        ↓
Pharmacist confirms outreach
        ↓
ElevenLabs agent calls through Twilio
        ↓
Call result + structured summary returned to MediCall

The Command Center can also handle requests such as:

"Find patients affected by active recalls who have not been contacted yet."

Gemini can inspect the relevant records, call application tools, and return the resulting patients and actions directly in the interface.

Tech Stack

Layer

Technology

Frontend

React 19, TypeScript, Tailwind CSS, Radix UI

Full-stack framework

TanStack Start, TanStack Router, Vite

Database & authentication

Supabase

Generative AI

Google Gemini API, Vercel AI SDK

Voice AI

ElevenLabs Conversational AI

Telephony

Twilio

Recall data

openFDA Drug Enforcement API

Validation

Zod

Data visualization

Recharts

Database tooling

Drizzle ORM / Drizzle Kit

Development

Lovable, GitHub

Demo

Live app: https://medicallhack.lovable.app/

Suggested demo flow

Open the dashboard and inspect active recall matches.

Use the Gemini Command Center to find affected patients.

Open a flagged patient and review the recall details.

Use the Medication Scanner on mobile to scan a drug label.

Prepare and confirm an AI outreach call.

Show the resulting outreach record and post-call summary.

Optionally use the Recall Simulator to demonstrate the pipeline with a fictional recall.

<details>
<summary><strong>Demo account</strong></summary>

Email: demo@medicall.example
Password: MediCallDemo2026!

The demo workspace uses synthetic patient data.

</details>

Local Development

Prerequisites

Node.js 20+

npm or Bun

Supabase project credentials

Gemini API access

ElevenLabs Conversational AI credentials

Twilio-backed ElevenLabs phone number for outbound calls

Setup

git clone https://github.com/Jeffjone/MediCall.git
cd MediCall
npm install
npm run dev

Environment Variables

Create a local environment file and configure the services you intend to use:

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=

# Gemini / AI gateway
GOOGLE_AI_API_KEY=
LOVABLE_API_KEY=

# ElevenLabs / Twilio
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_PHONE_NUMBER_ID=
DEMO_CALL_NUMBER=

# Optional database migrations
LOVABLE_DB_MIGRATION_URL=

Scripts

npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
npm run format    # Prettier

Project Structure

MediCall/
├── drizzle/                  # Database schema and migrations
├── public/                   # Static assets
├── src/
│   ├── components/           # UI and dashboard components
│   ├── integrations/
│   │   └── supabase/         # Supabase client, auth, and types
│   ├── lib/                  # Recall, AI, scanner, and outreach logic
│   └── routes/
│       ├── _authenticated/   # Protected app routes
│       └── api/              # Command Center and server APIs
├── supabase/                 # Supabase project assets
├── tests/                    # Tests
├── package.json
└── roadmap.md

Safety Boundaries

MediCall deliberately keeps consequential healthcare actions behind deterministic checks and human approval.

Patient data in the demo is synthetic.

Recall matches are screening signals, not clinical determinations.

A pharmacist must review and confirm outbound outreach.

AI does not prescribe medication or independently alter treatment.

Simulated recalls are explicitly labeled and separated from real FDA records.

FDA recall details and affected lots should be independently verified before real-world use.

Why We Built It

Medication safety workflows are often fragmented across recall notices, pharmacy records, manual lookups, and outbound communication. MediCall demonstrates how structured public-health data, deterministic matching, multimodal AI, agentic orchestration, and conversational voice systems can be combined into a single pharmacist-supervised workflow.

<div align="center">

MediCall — Know Sooner. Act Faster.

HackRice 2026 · Healthcare Track

</div>
