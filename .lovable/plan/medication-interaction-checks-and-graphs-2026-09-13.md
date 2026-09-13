# Medication interaction checks and graphs

## What will change
- Add **Create interaction graph** to each saved analysis. Save the resulting graph with the patient’s analysis so staff can reopen it.
- Show an interactive medication-and-allergy graph: select a connection to see the potential conflict, the supporting FDA label passage, source link, and a plain-language Gemini explanation.
- Add **interaction_check** alongside recall matching for patients with two or more active medications; check every unique medication pair in both directions. Also check known allergies against medication ingredients and relevant label warnings.
- Display **Interaction risk** separately from **Recall risk** on the dashboard, using a distinct icon and color. Include interaction-only patients, not just patients affected by recalls.
- Show check status, evidence gaps, and timestamps; never label an unchecked or incomplete regimen as safe.

## Clinical safeguards and data limitations
- Current demo records contain prescription fill dates and days supplied, but no explicit active-medication status or allergy history. Derive the initial active window from fill date plus days supplied, identify that assumption on results, and support explicit active/inactive status when supplied.
- Missing allergy history means **Allergies unknown**, not “no allergies.” Do not invent allergy records or change demo prescriptions to manufacture risks.
- FDA labels are not a complete drug-interaction database. Distinguish a supported potential conflict from an inconclusive check; class-level warnings require cautious interpretation.
- Gemini explains source-supported findings; it cannot invent evidence, declare a regimen safe, prescribe replacements, or automatically trigger outreach. All findings require pharmacist review.

## Technical implementation
- Add authenticated server-side openFDA label retrieval using the existing private FDA API key. Match NDC first; clearly identify any ingredient/name fallback and unresolved products. Cache label evidence and avoid sending patient names/contact details to FDA or Gemini.
- Add shared interaction types and a server-side checking pipeline. Store per-user results with regimen/allergy fingerprints, source identifiers and timestamps; invalidate stale results when inputs change.
- Keep automatic label checks separate from on-demand Gemini graph explanations to avoid repeated AI calls during page navigation. Surface partial failures and actionable errors without treating them as negative findings.
- Use a supported Gemini model from the live model list, validate its structured output and evidence references, and render graph nodes/edges with accessible selection and zoom controls plus a readable findings list.
- Integrate stored interaction results into shared patient flagging while preserving recall-specific counts, analysis approvals and outreach safeguards.

## Verification
- Test pair enumeration, active-window boundaries, unknown allergies, unresolved labels, source validation, cache invalidation and interaction-only dashboard rows.
- Make a real FDA request and Gemini graph-generation request, verify persistence and reopening, and check graph controls and narrow-screen layout.