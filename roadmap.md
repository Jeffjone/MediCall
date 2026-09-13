# Interaction checks
- [x] FDA pair/allergy checking and private persistence
- [x] Saved Gemini graph and separate dashboard flags
- [x] Tests and live verification

# Reliability audit
- [x] Audit frontend, server, and gateway failure paths
- [x] Add shared error classification and safe recovery
- [x] Fix confirmed issues and add regression coverage
- [x] Verify public/protected routes and document test limits

Verification: 15 error-handling regression tests passed; public/auth routes and nine authenticated routes smoke-tested; mobile invalid-upload recovery verified. Authenticated run had no browser exceptions. Calls, paid AI generation, and admin mutations were not executed. Signed-out protected redirects emitted development hydration warnings; one repeat login timed out, then succeeded on rerun. These intermittent issues remain for follow-up; this audit does not establish production-wide absence of errors.
