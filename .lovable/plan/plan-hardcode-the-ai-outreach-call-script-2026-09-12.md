# Plan: Hardcode the AI outreach call script

## Goal

Define one fixed spoken script for the ElevenLabs outreach call, hardcoded in
the Medicall codebase. The same script runs for every patient; only
patient-specific fields (name, medication, recall class, reason, recall
number, pharmacy name) are injected at call time. This removes the dependency
on the ElevenLabs web-UI prompt so the script lives with the app.

## How it works

ElevenLabs Conversational AI outbound calls accept per-call **overrides** in
`conversation_initiation_client_data.overrides.agent`. We will pass two
override fields on every call:

- `first_message` — the exact opening line the agent speaks.
- `prompt` — the system instructions that govern the rest of the conversation.

Patient/recall specifics keep flowing through `dynamic_variables` (already
wired), so the script text references them as `{{patient_name}}`,
`{{drug_name}}`, etc.

## Changes

### 1. New file: `src/lib/outreach-script.ts`

Holds the hardcoded script and system prompt as exported constants.

**First message (spoken first):**

```text
Hello, may I speak with {{patient_name}}? This is {{pharmacy_name}} calling
with an urgent safety notice about your medication.

We've been notified by the FDA that {{drug_name}} {{drug_strength}},
which you are currently prescribed, has been recalled. This is a
{{recall_classification}} recall. The reason given is: {{recall_reason}}.

For your safety, please stop taking this medication and set aside any
remaining supply. Do not dispose of it yet — our pharmacy can advise on
proper disposal. Please contact your doctor or call us back as soon as
possible to arrange a safe alternative treatment.

The FDA recall reference number is {{recall_number}}. Do you have any
questions, or would you like me to note that you'll call the pharmacy
shortly?
```

**System prompt (governs the rest of the call):**

```text
You are an automated pharmacy recall-notification assistant calling on
behalf of {{pharmacy_name}}. The patient is {{patient_name}}, prescribed
{{drug_name}} {{drug_strength}} (NDC {{ndc}}), which is under an
{{recall_classification}} FDA recall ({{recall_number}}). Reason:
{{recall_reason}}.

Rules:
- Speak clearly and at a calm, reassuring pace.
- Confirm you are speaking with {{patient_name}} before giving details.
- Advise the patient to stop taking the medication and contact their
  doctor or pharmacy for a replacement.
- Do not give medical advice beyond the recall notice and the instruction
  to consult a licensed professional.
- If the patient asks something you cannot answer, tell them to call
  {{pharmacy_name}} and end the call politely.
- Keep the call under two minutes.
```

### 2. Edit: `src/lib/outreach.functions.ts`

In the `conversation_initiation_client_data` object, add an `overrides`
block that injects `first_message` and `prompt` from the new constants.
The existing `dynamic_variables` stay as-is so the `{{...}}` placeholders
resolve per patient. No other call behavior changes.

```text
conversation_initiation_client_data: {
  dynamic_variables: { ...existing... },
  overrides: {
    agent: {
      first_message: OUTREACH_FIRST_MESSAGE,
      prompt: OUTREACH_SYSTEM_PROMPT,
    },
  },
}
```

### 3. No UI change

The Initiate Call button, confirmation dialog, call log, and demo-number
behavior all stay the same. The only user-visible difference is the spoken
script the patient hears.

## What stays the same

- All calls still dial the single verified demo number (`DEMO_CALL_NUMBER`).
- Patient-specific values are still passed as dynamic variables.
- The ElevenLabs agent ID, phone number ID, and API key are still read from
  server-side env.

## Note on the ElevenLabs agent

The agent in the ElevenLabs web UI no longer needs a custom prompt or first
message — the per-call overrides take precedence. You can leave the agent
configured with a placeholder; Medicall supplies the real script on each call.
