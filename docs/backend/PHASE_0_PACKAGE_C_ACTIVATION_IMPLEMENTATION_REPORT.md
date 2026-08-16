# Phase 0 Package C: Activation — Implementation Report

**Date:** 2026-08-16 · **Type:** Code change (in `teracom-ai-backend`, a sibling repository — not this repository) · **Scope:** Package C (Activation) only, per [[phase-0-master-implementation-plan-v1]] §5.

---

## 1. Scope

Implements exactly Package C from [[phase-0-master-implementation-plan-v1]] §5: the `hardware_fingerprints` schema, the fingerprint-combination algorithm and 2-of-3 tolerance rule, initial activation wired into Licensing's Licence Generation Workflow (Package A), an Activation validation workflow, and API endpoints — on top of Packages A (Licensing) and B (Entitlements), both already implemented and validated. **Marketplace, Worker Packs, and Recommendation Engine were explicitly not implemented**, per this task's instruction — none is touched anywhere in this change.

**Changes are in `teracom-ai-backend`**, a separate git repository. All changes are untracked/modified, uncommitted files (`git status --short`: 7 modified, 4 new/untracked) — nothing was committed.

## 2. Files created/changed

New: `models/hardware_fingerprint.py`, `services/activation_service.py`, `alembic/versions/68cd6086c905_add_hardware_fingerprints_table_and_.py`, `tests/test_activation.py`.

Modified: `models/licence.py` (new `hardware_fingerprint_id` column), `services/licence_generation_service.py` (calls activation binding as the workflow's final stage), `api/licensing.py` (two new endpoints), `schemas/licensing.py` (new request/response schemas), `alembic/env.py` and `create_tables.py` (import the new model), `tests/test_migrations.py` (one-line import addition, same pattern as Packages A/B).

## 3. Activation schema, entities, hardware fingerprint support

New table `hardware_fingerprints` (`licence_id` FK — **deliberately not unique**, since re-binding creates a new row chained via `superseded_by_id` rather than mutating the old one, per [[licensing-service-architecture-v1]] §9/§9.3), plus a nullable `licences.hardware_fingerprint_id`. `services/activation_service.py` implements the two algorithms named as PROPOSED (not yet ratified) in that document, exactly as specified there:

- **Combination algorithm (§9.1):** `SHA-256(vm_uuid || disk_uuid || tpm_identifier-or-"none")`, versioned (`fingerprint_version`) so a future algorithm change doesn't silently reinterpret an existing fingerprint.
- **Tolerance rule (§9.2):** a match is valid if at least 2 of 3 components agree — a single legitimate hardware change (e.g. one disk swap) doesn't register as a licence violation. If the *stored* fingerprint has no TPM component at all, only 2 components exist and both must match (no third component available to permit a mismatch against) — this edge case is not addressed explicitly in the architecture document and is this package's own reasonable extension of the stated rule, flagged as such in `LICENSING.md`, not presented as already-ratified.

## 4. Initial activation wired into Licence Generation

`generate_licence()` (Package A) now binds a hardware fingerprint as its final stage, **only when the originating request's payload actually supplied `vm_uuid`/`disk_uuid`** — consistent with hardware binding not being applicable to every hosting model (e.g. Teracom Hosted, [[licensing-service-architecture-v1]] §9.4). The resulting hash is embedded in the signed JWS claims' `hardware_fingerprint_hash` field, which Package A left permanently `null`. Correct flush ordering was required and verified: the `licences` row must be flushed before the `hardware_fingerprints` row can be inserted (its `licence_id` is a real foreign key), and the fingerprint must exist before the claims are assembled and signed.

## 5. Activation validation workflow

`validate_activation(licence_id, candidate, db)` is **deliberately separate from, and does not modify,** Package A's `licence_validation_service.py#validate_licence()`, which remains fully offline (signature + expiry only, no database access). The split reflects the architecture's own Core Runtime/Teracom Intelligence Cloud boundary: the *authoritative* stored fingerprint record and match decision live in this backend; the *device-side* recomputation a real Core Runtime instance would perform entirely offline against the hash already embedded in its own locally-held signed licence is a separate, not-yet-built client artefact this package does not implement or attempt to simulate. `validate_activation` is exposed for use when connectivity exists — reconciliation, support tooling, or a periodic check-in — returning `{bound, matches, reason}`; an unbound licence always reports `matches: true` by definition (nothing to check against).

## 6. API endpoints

`GET /licensing/activation/{licence_id}` (current binding — returns only the derived hash and metadata, deliberately not the raw `vm_uuid`/`disk_uuid`, a minimal-disclosure choice) and `POST /licensing/activation/{licence_id}/validate` (checks a candidate device against the stored record). Both customer-authenticated and scoped to the caller's own organisation, following the same 404-not-403 cross-organisation pattern already established for `GET /licensing/entitlements/{licence_id}` (Package B).

## 7. A real bug found and fixed: an unnamed foreign key constraint breaks its own downgrade

Alembic's autogenerated migration for `licences.hardware_fingerprint_id` (a genuinely circular reference — `hardware_fingerprints.licence_id` → `licences.id` and `licences.hardware_fingerprint_id` → `hardware_fingerprints.id`) used `op.create_foreign_key(None, ...)`, leaving the constraint unnamed. This is accepted silently by `upgrade()`, but **running `downgrade()` — not merely inspecting the generated file — failed** with `CompileError: Can't emit DROP CONSTRAINT ...; it has no name`. Caught by actually executing the downgrade as part of this package's own verification discipline, not by code review alone. Fixed by naming the constraint explicitly (`fk_licences_hardware_fingerprint_id`) in both `upgrade()` and `downgrade()`, then re-running the full upgrade → downgrade → re-upgrade round trip from a clean schema to confirm the fix.

## 8. Tests

`tests/test_activation.py` — 14 tests: fingerprint-hash determinism and sensitivity to each component (3), the tolerance rule at every boundary (exact match, one-of-three mismatch tolerated, two-of-three mismatch rejected, no-TPM-requires-both-remaining-components, completely different device rejected — 5), and 6 end-to-end tests against the real API: initial issuance with fingerprint data binds hardware correctly, issuance without it has no activation record (404), validating a tolerated single-component change matches, validating a genuinely different device is rejected with a reason, an unbound licence always reports a match, and the activation endpoint is correctly scoped to the requesting organisation.

## 9. Validation

### Build
`python -c "import main"` succeeds after every change.

### Tests
`python -m pytest tests/` — **60 passed** (14 new Activation tests, plus the 46 pre-existing tests from Packages 1/2/A/B — one of which needed the same one-line dynamic-table-list import addition as every prior package's migration).

### Migration + API verification
The migration was verified with the same isolated-schema round trip used for every prior package — including catching and fixing the unnamed-constraint bug in §7 before it reached the real database — then applied to the real dev database (14 tables → 15, nothing existing altered). Live verification against a running server: signup → staff seeded → login → submitted a Sovereign-hosted `initial_issuance` request with real fingerprint components → staff approved → `GET /licensing/activation/{licence_id}` returned the correct binding (`tpm_present: true`, a 64-character SHA-256 hex digest). Confirmed the same hash is embedded in the signed licence's own claims by decoding it directly with `validate_licence()`. Exercised the tolerance rule live: a request with one component changed (simulating a legitimate disk replacement) returned `matches: true`; a request from an entirely different device returned `matches: false` with a reason. Cross-organisation scoping was verified live: a second organisation's token received a 404, not the first organisation's activation data. All verification rows were deleted afterward; the pre-existing real "Teracom AI" organisation was confirmed unaffected (`status: active`) throughout.

## 10. Explicitly not done

- Marketplace, Worker Packs, Recommendation Engine — not implemented; no code in this change relates to any of them.
- The `hardware_rebind` request type's actual re-binding workflow — only the schema/request-type support exists (already present since Package A); approving a `hardware_rebind` request does not currently swap a licence's binding, per this package's own explicit scoping (matching [[phase-0-master-implementation-plan-v1]] §5's framing of the re-binding *workflow* as deferred).
- No Core Runtime client-side fingerprint capture (reading actual VM/Disk UUIDs from a real host) — a separate, not-yet-built artefact; this package implements the algorithm and server-side storage/validation of whatever components are submitted to it.
- No git commit in `teracom-ai-backend` — all changes remain uncommitted.
