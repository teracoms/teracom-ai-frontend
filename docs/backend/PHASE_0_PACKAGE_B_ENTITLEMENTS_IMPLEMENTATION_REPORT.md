# Phase 0 Package B: Entitlements — Implementation Report

**Date:** 2026-08-16 · **Type:** Code change (in `teracom-ai-backend`, a sibling repository — not this repository) · **Scope:** Package B (Entitlements) only, per [[phase-0-master-implementation-plan-v1]] §4.

---

## 1. Scope

Implements exactly Package B from [[phase-0-master-implementation-plan-v1]] §4: the `entitlements` table and CRUD layer, the worker-pack recompute formula, and the entitlement-gating function future Intelligence Cloud endpoints will call — built on top of Package A (Licensing), already implemented and validated ([[phase-0-package-a-licensing-implementation-report]]). **Activation and Marketplace were explicitly not implemented**, per this task's instruction — neither is touched anywhere in this change.

**Changes are in `teracom-ai-backend`**, a separate git repository. All changes are untracked/modified, uncommitted files (`git status --short` confirmed: 10 modified, 21 new/untracked) — nothing was committed.

## 2. Files created/changed

New: `models/entitlement.py`, `services/entitlement_service.py`, `alembic/versions/f9ebf819185f_add_entitlements_table.py`, `tests/test_entitlements.py`.

Modified: `services/licence_generation_service.py` (moved `compute_entitlement` out, now persists an `entitlements` row on every issuance), `api/licensing.py` (new `GET /licensing/entitlements/{licence_id}`), `schemas/licensing.py` (new `EntitlementResponse`), `alembic/env.py` and `create_tables.py` (import the new model), `tests/test_migrations.py` (see §5).

## 3. What was built

- **`entitlements` table**: `id`, `licence_id` (unique FK → `licences.id`), `worker_limit`, `user_limit` (nullable), `organisation_limit`, `hosting_model` (duplicated from `licences.hosting_model` deliberately, per [[licensing-service-architecture-v1]] §5 — a self-contained row an enforcement check can read without a join), `created_at`/`updated_at`.
- **`compute_entitlement(tier, licensed_user_count)`** — moved from `licence_generation_service.py` into the new `services/entitlement_service.py`, unchanged in behaviour. This is exactly the handoff Package A's own report anticipated: *"A future Entitlements package replaces this function's body with a real persisted computation; the signed-claims shape it feeds does not change."* The shape didn't change; what changed is that `generate_licence()` now also calls `create_entitlement_for_licence()` to persist the result, which Package A's inline-only version never did.
- **`recompute_worker_limit(tier, additional_packs)`** — the formula `tier_base_workers + Σ(pack_size × quantity)`, exactly as specified. Takes a list of `(pack_size, quantity)` tuples rather than reading from a persisted table — per the master plan's own scoping of this item to the *formula*, not to storing individual pack purchases (that belongs to a separate, later Worker Packs package, distinct from Entitlements in both the master plan and [[teracom-intelligence-cloud-implementation-roadmap-v1]]'s own 8-item list).
- **`capability_allowed_for_tier(tier, capability)`** — the shared entitlement-gating function, built now per the master plan's own reasoning ("so the gating pattern is established once rather than retrofitted later"), with the tier minimums from [[teracom-intelligence-cloud-mvp-v1]] §5's table (`recommendation_engine`/`workforce_creation_intelligence`/`knowledge_enrichment`/`memory_enrichment` → Enterprise; `orchestration_intelligence` → Platinum). Raises `ValueError` on an unregistered capability or tier name, so a typo fails loudly rather than silently allowing or denying.
- **`GET /licensing/entitlements/{licence_id}`** — a new, minimal customer-facing read endpoint, scoped to the caller's own organisation. Not explicitly named in the master plan's endpoint list, but added to make the "CRUD layer" the plan calls for actually reachable and independently verifiable — a licence belonging to a different organisation returns 404 (not 403), so the endpoint doesn't confirm or deny another organisation's licence IDs exist.

## 4. Wiring into Licence Generation

`generate_licence()` (Package A) now calls `create_entitlement_for_licence()` immediately after flushing the new `licences` row, in the same transaction — a licence and its entitlement snapshot are created atomically, never one without the other.

## 5. Tests

`tests/test_entitlements.py` — 21 tests: `compute_entitlement` (2, confirming the moved function's behaviour is unchanged), `recompute_worker_limit` (3, no packs / one pack / multiple pack types and quantities), `capability_allowed_for_tier` (8 parametrised cases across tiers and capabilities, plus 2 for unknown-capability/unknown-tier rejection), and 3 end-to-end tests against the real API: approving a request persists and exposes the correct entitlement values, the entitlement endpoint is properly scoped to the requesting organisation (a second organisation's token gets 404 on another organisation's licence), and an unknown licence ID returns 404.

**The same pre-existing test needed the same kind of fix as in Package A, for the same reason:** `test_migrations.py`'s dynamically-derived expected-table-set helper (fixed in Package A specifically so this wouldn't keep happening) needed one more import added — `models.entitlement` — since it derives the set from an explicit import list, not auto-discovery. This is a one-line addition, not a re-fix of the same bug; the derivation approach itself is unchanged from Package A.

## 6. Validation

### Build
`python -c "import main"` succeeds after every change.

### Tests
`python -m pytest tests/` — **46 passed** (21 new Entitlements tests, plus the 25 pre-existing tests from Packages 1/2/A — one of which needed the one-line import addition in §5). All run against disposable, per-test Postgres schemas via the real Alembic migrations.

### Validation (migration + live API)
The migration was verified with the same isolated-schema upgrade/downgrade/re-upgrade round-trip used for every prior package, then applied to the real dev database (confirmed: the pre-existing `entitlements`-free 13-table schema became 14 tables, no existing table altered). Live verification against a running server: signup → staff user seeded → login → submitted a Platinum-tier `initial_issuance` request with `licensed_user_count: 80` → staff approved directly (skipping the optional review step, confirming that path still works) → `GET /licensing/entitlements/{licence_id}` returned `worker_limit: 50, user_limit: 80, organisation_limit: 30, hosting_model: dedicated_hosted` — the correct Platinum-tier values with the requested user count applied. Cross-organisation scoping was verified live: a second, unrelated organisation's token received `404 Licence not found` when attempting to read the first organisation's entitlement by ID. All verification rows were deleted afterward; the pre-existing real "Teracom AI" organisation was confirmed unaffected (`status: active`) throughout.

## 7. Explicitly not done

- Activation — not implemented; `licences.hardware_fingerprint_id` still does not exist.
- Marketplace — not implemented; no code in this change relates to it in any way.
- No persisted worker-pack rows — `recompute_worker_limit` implements the formula only, per this package's own scoping (see §3).
- No enforcement of the worker-limit-blocks-creation policy inside `POST /workers/` — a separate, already-tracked gap, explicitly excluded from this package's validation bar by the master plan itself.
- No git commit in `teracom-ai-backend` — all changes remain uncommitted.
