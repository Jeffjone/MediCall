# Medicall command center

Add a separate **Command center** page, powered by the available **Gemini 3.1 Pro Preview**, without replacing the existing pages.

## Experience
- A natural-language conversation with streaming responses, visible tool activity, errors, and a stop control.
- Commands can check FDA recalls, find affected patients, prioritize cases, run patient analyses, prepare outreach, and summarize results without navigating between pages.
- Suggested starting commands include “Check recalls and identify affected patients” and “Prepare outreach for flagged patients.”
- Keep the full conversation during the current session; no durable chat storage in this version.

## Automated workflow and safeguards
- Use actual recall and patient records through server-side tools, not invented results. Label fallback FDA data and historical recalls clearly.
- Let Gemini coordinate multiple steps and return patient-specific results with links to existing detail/review surfaces.
- Present clinical analyses for explicit pharmacist review. Never let the model approve its own alternatives.
- Require an explicit confirmation for each outbound call, displaying patient, medication, approved-plan status, and the demo destination. All calls continue to use the verified demo number.
- Stop a workflow on credit/policy errors, preserve completed results, and distinguish a requested call from confirmed delivery.
- Reuse the existing analysis approval and outreach functions, with approved-account checks on every server action.

## Technical implementation
- Add `/command-center` under the authenticated layout and a sidebar entry.
- Add a streaming chat endpoint using AI SDK `useChat`, `streamText`, schema-defined tools and bounded agent steps.
- Use `google/gemini-3.1-pro-preview` for the new coordinator; keep existing analysis model calls unchanged.
- Authenticate raw chat requests with the active pharmacy session token and verify approved pharmacy access server-side.
- Add reusable gateway/run-ID helpers, command-center tool definitions, and small chat/tool-result components. Reuse analysis review and call confirmation components where possible.
- Validate real Gemini tool calls, unauthenticated rejection, conversation continuity, error handling, and the new page. Do not place a real test call without explicit permission.
