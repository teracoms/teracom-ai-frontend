# Phase 0 Package A: Licensing Service — Implementation Report

**Date:** 2026-08-16 · **Type:** Code change (in `teracom-ai-backend`, a sibling repository — not this repository) · **Scope:** Package A (Licensing) only, per [[phase-0-master-implementation-plan-v1]] §3.

---

## 1. Scope

Implements exactly Package A from [[phase-0-master-implementation-plan-v1]]: the licensing database schema, licence entities, the licence-request state machine, the signing workflow, the validation workflow, API endpoints, tests, and documentation. **Entitlements and Activation were explicitly not implemented**, per this task's own instruction — see §7 for exactly what that means for this package's behaviour.

**Changes are in `teracom-ai-backend`**, a separate git repository from this one. All changes are untracked/modified, uncommitted files (confirmed via `git diff --stat`: 11 files modified, 20 new) — nothing was committed.

## 2. Files created/changed

New: `models/staff_user.py`, `models/licence.py`, `models/licence_request.py`, `models/licensing_audit_log.py`, `schemas/licensing.py`, `auth/staff_security.py`, `auth/staff_dependencies.py`, `services/licence_signing_service.py`, `services/licence_validation_service.py`, `services/licence_generation_service.py`, `api/licensing.py`, `api/staff_auth.py`, `api/staff_licence_requests.py`, `api/staff_licensing_audit.py`, `alembic/versions/67ed586c7a65_...py`, `tests/test_licensing.py`, `LICENSING.md`.

Modified: `config.py` (signing keys, staff JWT audience, term/grace-period settings), `main.py` (router registration), `alembic/env.py` and `create_tables.py` (import the four new models), `.env`/`.env.example` (new settings), `tests/test_migrations.py` (see §6).

## 3. Licensing database schema, entities, state machine

Four new tables — `staff_users`, `licences`, `licence_requests`, `licensing_audit_log` — matching [[licensing-service-architecture-v1]] §3/§10/§11.1/§21 exactly, with two deliberate simplifications: no `subscription_id`/`hardware_fingerprint_id` on `licences` (Subscriptions and Activation are separate, unbuilt concerns), and the signed artefact is stored directly in `signed_payload_ref` rather than a pointer to separate blob storage. The state machine (`submitted → under_review → approved/rejected → issued`) is implemented exactly as specified, with the `under_review` transition available but optional — a decision can be made directly from `submitted`.

## 4. Signing and validation workflow

**A real, load-bearing implementation decision made during this task, not anticipated in the architecture document:** [[licensing-service-architecture-v1]] §13.2 recommended Ed25519 with RS256 as a fallback "if broader library compatibility is a stronger constraint." Direct inspection of this environment found `python-jose` installed **without** its `cryptography` backend (pure-Python `rsa`/`ecdsa` only) — confirmed by checking installed packages and `jws.ALGORITHMS.SUPPORTED` directly, not assumed. Ed25519/EdDSA is not available on that backend; RS256 is, with zero new dependencies. RS256 was chosen on that basis and prototyped (sign/verify/tamper-detection) before being built into the real module.

**A second, more significant finding, caught by direct empirical testing before it became a real vulnerability:** the initial staff/customer JWT isolation design relied on `python-jose`'s `audience=` decode parameter to enforce that only a token carrying `aud: "teracom-staff"` could authenticate as staff. A direct test proved this parameter **only rejects a mismatched audience — a token with no `aud` claim at all (i.e. any ordinary customer session token) is decoded successfully regardless.** Left as originally written, this would have meant any customer's own login token could authenticate as staff. Fixed by adding an explicit manual check of the decoded `aud` claim in `auth/staff_security.py#verify_staff_token`, verified again afterward with a four-case empirical test (staff token via staff verifier: accepted; customer token via staff verifier: rejected; staff token via customer verifier: rejected; customer token via customer verifier: accepted) before writing a single line of API code against it.

The validation workflow (`services/licence_validation_service.py`) implements signature verification and expiry-based `active`/`grace`/`locked` derivation. Hardware-fingerprint checking (Activation) and the clock-tampering mitigation (already an accepted, unresolved residual risk in the architecture document) are not implemented, by design.

## 5. API endpoints

`POST /staff/login`, `GET /staff/me`, `POST /licensing/requests`, `GET /licensing/requests`, `GET /staff/licence-requests`, `POST /staff/licence-requests/{id}/review`, `POST /staff/licence-requests/{id}/decision`, `GET /staff/licensing-audit` — registered in `main.py` following the existing per-module-router pattern. `POST /staff/login` deliberately takes a JSON body, not query parameters, per [[customer-bootstrap-architecture-v1]]'s recommendation not to repeat the existing customer `/auth/login` quirk on any new endpoint.

## 6. Tests

`tests/test_licensing.py` — 20 tests: signing/verification (roundtrip, tamper, malformed), entitlement computation (all three tiers), validation status derivation (active/grace/locked/invalid/unknown-key-version), the full submit→review→approve→issued lifecycle against the real API, rejection, double-decision (409), unknown-request (404), missing-field validation (422), and the staff/customer authentication isolation property in both directions plus staff login failure modes (wrong password, inactive account).

**A pre-existing test required a fix, not a workaround:** [[customer-bootstrap-package-1-implementation-report]]'s `test_migrations.py` hardcoded the exact table set the *baseline* migration produces and asserted it against `alembic upgrade head`. Since "head" now includes this package's migration, that assertion broke — correctly, since the set of tables at head genuinely changed. Fixed by deriving the expected table set from `Base.metadata.tables.keys()` (the same source `alembic/env.py`'s autogenerate already compares against) instead of a hand-maintained literal list, so this doesn't recur for every future package's migration. This is the only pre-existing file this package's tests required changing.

## 7. Scoping boundary: what "no Entitlements, no Activation" means concretely

- No `entitlements` or `subscriptions` tables — worker/user/organisation limits are computed inline from `tier` (`compute_entitlement()`, a constant lookup matching `LICENSING_MODEL_V1.md` §2), explicitly documented as the one thing a future Entitlements package replaces without changing this package's external shape.
- `licences.hardware_fingerprint_id` does not exist; every issued licence's `hardware_fingerprint_hash` claim is `null`.
- The Licence Generation Workflow only runs for `initial_issuance` and `renewal`. Other request types can be submitted and decided through the same generic pipeline (per the architecture document's one-table design), but an approval on `worker_pack`/`tier_change`/`hosting_change`/`ownership_transfer`/`hardware_rebind` does not generate a licence — that needs data these two excluded packages would supply.

## 8. Validation

### Build
`python -c "import main"` succeeds after every change, both before and after the migration was applied.

### Tests
`python -m pytest tests/` — **28 passed** (20 new licensing tests, plus the 8 pre-existing Package 1/2 tests, one of which required the fix in §6). All run against disposable, per-test Postgres schemas via the real Alembic migrations.

### API verification
Performed against a live `uvicorn` process, with cleanup afterward: customer signup → staff user seeded directly (no self-service staff signup, by design) → staff login → customer submits an `initial_issuance` request (Enterprise tier, 25 licensed users) → staff sees it in the cross-organisation queue → marked under review → approved. Confirmed directly via SQL and the validation service: the resulting licence is RS256-signed, decodes to the correct entitlement claims (`worker_limit: 30, user_limit: 25, organisation_limit: 5`), `status` derives to `active`, the organisation flipped from `pending_licence` to `active`, and the audit log recorded all four events (`request_submitted`, `request_reviewed`, `request_approved`, `licence_issued`). Confirmed the isolation property live: the customer's token was rejected by `/staff/licence-requests` (401), and the staff token was rejected by both `/licensing/requests` and `/auth/me` (401 in both cases). All verification rows (organisation, users, licence, licence request, audit log entries, staff user) were deleted afterward; the pre-existing real "Teracom AI" organisation was confirmed unaffected (`status: active`) throughout.

## 9. Explicitly not done

- Entitlements and Activation — not implemented, per this task's explicit instruction.
- No middleware wiring of validation results into request-blocking enforcement — a separate, later package.
- No git commit in `teracom-ai-backend` — all changes remain uncommitted, awaiting the project owner's own review/commit decision.
