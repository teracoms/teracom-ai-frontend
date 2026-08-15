# Backend Remediation History

**⚠️ Second-hand documentation**, same caveat as [[backend-status]]: `teracom-ai-backend` is a separate repository not checked into this one. This document records what is *referenced* about backend security remediation work from within `docs/frontend/FRONTEND_ARCHITECTURE.md` and the two implementation reports under `docs/frontend/IMPLEMENTATION_REPORTS/` — it is not a firsthand review of that remediation.

---

## What is referenced

`docs/frontend/FRONTEND_ARCHITECTURE.md` §B.3 states that, as of a document referred to as `FINAL_SECURITY_REMEDIATION.md` (dated 2026-08-14 in that source), the backend had already been through one security-hardening pass covering:

- Upload path traversal — fixed.
- Filename sanitisation — added.
- Extension allow-list — added.
- Streaming size-limit enforcement — added.
- Secrets externalised to `.env` (previously presumably hardcoded or otherwise not externalised).
- Malformed password-hash no longer crashes login (previously, a malformed hash in the `users.password_hash` column would crash the login flow rather than fail gracefully).

Separately, `AUTHENTICATION_IMPLEMENTATION_REPORT.md` §6.5 notes that this same `FINAL_SECURITY_REMEDIATION.md` documents **two backend accounts** (`robert@teracom.ai`, `jwt@teracom.ai`) with no known-good password — one has a literal non-hash placeholder (`"temp"`) in `password_hash`. This blocked reusing an existing account for that package's end-to-end smoke test, requiring a temporary test account to be created and deleted instead.

## What this repository does NOT have

- The actual `P0_REMEDIATION_REPORT.md`, `FINAL_P0_REVIEW.md`, or `FINAL_SECURITY_REMEDIATION.md` files themselves — these live in `teracom-ai-backend` and were not available when this knowledge base was assembled (2026-08-15). Every claim above is a citation of what those documents are *reported to say*, not a direct reading of them.
- Any independent verification that the fixes above are actually in place in the current backend codebase — no one has re-checked this from the frontend side.
- Any record of security remediation work that may have happened *after* the date referenced above — this document has a known horizon and should not be assumed current.

## Action item for whoever next has backend access

Pull the three named backend documents (or their current equivalents) into `docs/backend/IMPLEMENTATION_REPORTS/`, replacing the placeholder there, and update this file to cite them directly rather than secondhand. Until then, treat every fact in this file and in [[backend-status]] as provisional.
