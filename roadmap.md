# Intelligence workflow
- [x] Add RxNorm enrichment, simulated finances and replaceable pricing.
- [x] Add authenticated AI analysis and signed pharmacist approval receipts.
- [x] Add patient review UI and approved dynamic outreach context.
- [x] Verify real AI + web-search response, RxNorm identity, receipt isolation, and successful build.
- [ ] Verify authenticated review UI end-to-end — blocked: preview sign-in did not establish a session; managed session mint found no account for requesting user.
- [ ] Verify a real outbound call — blocked: explicit test-call approval; no call placed in this change.

## Deliberate limitations
- Uses Lovable AI's assigned OpenAI Responses model, not Gemini or Google Search grounding.
- RxNorm enriches confirmed NDC cases; ingredient equivalence is not treated as proof of recall exposure.
- Financial summaries are simulated app-owned aggregates, not raw Nessie API payloads. Unknown prices/popularity remain unknown.
- Approved call context includes AI rationale and calculated estimates inside a safety-controlled template, not a fully AI-written opening.
- No runtime MCP connection, arbitrary code execution, or separate URL-context tool configured.
- Recall feed remains the original static FDA snapshot; analyses reset on reload. No durable approval audit history.

# Command center
- [x] Add authenticated Gemini coordinator and read/analysis/outreach preparation tools.
- [x] Add conversation page with inline review and confirmed calling.
- [x] Verify real Gemini interaction, auth boundary, and page rendering.

# Demo recall simulation
- [x] Add sidebar simulation, saved dummy recall and downloadable JSON.
- [x] Refresh matching, notifications, analysis and outreach from shared recall history; label simulations as fictional.
- [x] Verify simulation in the signed-in browser without placing a call: JSON downloaded, toast appeared, saved DEMO recall displayed with four affected patients.
