# Wave 1, Workstream 5 — Licensing and Entitlement Architecture — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (all code changes); `teracom-ai-frontend` (governance docs only — no frontend change needed). **Source:** `IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §5, itself derived from the amended `COMMERCIAL_READINESS_ASSESSMENT.md`'s finding that `Licence.tier` is a raw string with no `Plan` entity behind it and no identity-linking fields for a future billing integration. **Scope:** the schema/service-layer foundation only, exactly as the source plan bounded it — not the full Commerce-to-Licensing Lifecycle Automation service (webhook handling, self-service upgrade, real pricing), which remains separate, later work.

---

## 1. Investigation before implementation — the real footprint was larger than assumed

Before writing any code, the actual current state of licensing/entitlement code was traced in full (models, services, all API routes, every real call site of the tier-gating function). This surfaced two things worth recording:

- **`capability_allowed_for_tier()` has 13 real call sites**, not the source plan's own working estimate of seven — all funnelling through exactly one chokepoint: `services/marketplace_service.py#get_organisation_current_tier()`, which reads `Licence.tier` directly off the raw column. One additional direct read exists in `services/entitlement_provisioning_service.py`. A second, independently-hardcoded copy of the tier set also exists in `schemas/marketplace.py` (`WorkerPackCreate.min_tier` validation).
- **`LicensingAuditLog` already exists** and is already written to on every licence issuance (`generate_licence()`) — the source plan's call for "a licence/entitlement audit table" was already satisfied by existing infrastructure, not a gap.

Both findings directly shaped the scoping decisions below.

---

## 2. What was implemented

### Schema
- `models/plan.py` (new) — `Plan` entity: `code` (unique), `display_name`, `worker_limit`, `user_limit` (nullable), `organisation_limit`, `monthly_price_cents` (nullable — real pricing not yet decided), `is_active`.
- `models/licence_billing_reference.py` (new) — `LicenceBillingReference`: a 1:1 side table (`licence_id` unique FK) with `external_billing_provider`/`external_customer_id`/`external_subscription_id`/`external_invoice_reference`, all nullable, all currently unpopulated — forward-preparation for a future billing integration, kept off the core `Licence` model to avoid bloating it with fields dead-weight for virtually every row today.
- `models/licence.py` — new additive `plan_id` (nullable FK to `plans.id`). `tier` (the existing string column) is unchanged.
- Migration `9d4b6f1e2c7a` (revises `7a2c9e4f1b8d`): creates `plans`, seeds it with three rows mirroring `_TIER_LIMITS` exactly, adds `licences.plan_id`, backfills it for every existing licence by matching `tier` to the newly-seeded `Plan.code`, and creates `licence_billing_references`. Verified via the standard migration-correctness suite (upgrade/downgrade clean) and applied to the real dev database (0 existing licences in this environment, so backfill was trivially a no-op there — separately verified via a dedicated isolation test, see §3).
- All three model-registration sync points updated (`create_tables.py`, `alembic/env.py`, `tests/test_migrations.py`) for both new models.

### Service layer
- `services/plan_service.py` (new) — `get_plan_by_code()`, `list_plans()`. The one place `Plan` should be read from.
- `services/licence_generation_service.py#generate_licence()` — now resolves the requested tier's `Plan` and sets `licence.plan_id` on every newly-issued licence. This is the only behavioural change made to this function; `tier`, `compute_entitlement()`, and the signed-claims payload are all otherwise unchanged.

### API surface
- `schemas/licensing.py` — `LicenceResponse` gained `plan_id`; new `PlanResponse` schema.
- `api/licensing.py` — new `GET /licensing/plans` (any authenticated user — non-sensitive reference data), returning the real seeded plan catalogue. Not explicitly requested by the source plan's task breakdown, but judged in-scope: low-risk, read-only, and the direct answer to `COMMERCIAL_READINESS_ASSESSMENT.md`'s own finding that no plan/tier selector exists in signup partly because there was nothing real to select from. Building the signup-facing selector itself remains explicitly out of scope for this pass.

### What was deliberately NOT done, and why
- **`Licence.tier` was not removed, and none of the 13 confirmed enforcement call sites were changed.** Converting all of them to resolve tier via `plan_id`/`Plan` in this same pass would have been a materially larger, higher-risk change than a "one sprint, foundation-only" workstream should attempt — and would have violated the source plan's own explicit acceptance criterion that every existing licence's effective entitlement and every enforcement point's behaviour remain unchanged. This is the "expand" half of an expand-contract migration; the "contract" half (switching reads, then dropping `tier`) is named as a distinct, later piece of work, not silently dropped.
- **`services/entitlement_service.py#_TIER_LIMITS`/`compute_entitlement()` were left completely unchanged.** Switching `compute_entitlement()` to read `Plan` live would change its call signature — every existing test calls it with no `db` argument. A drift-guard test (`test_seeded_plans_match_tier_limits_exactly`) instead confirms the two stay in sync, without touching the function itself.
- **No new audit table was created.** `LicensingAuditLog` already exists, is already generic, and is already written to on issuance — creating a second, parallel table would have duplicated an existing mechanism.
- **No commerce/webhook integration, no self-service upgrade flow, no real pricing.** All remain part of the separate, larger Commerce-to-Licensing Lifecycle Automation service described in the amended `COMMERCIAL_READINESS_ASSESSMENT.md` §9.

---

## 3. Tests

New file `tests/test_plan_foundation.py`, 6 tests:
- `test_seeded_plans_match_tier_limits_exactly` — a drift guard confirming the seeded `Plan` rows match `_TIER_LIMITS` exactly, for all three tiers.
- `test_list_plans_returns_exactly_the_three_seeded_tiers` / `test_get_plan_by_code_returns_none_for_an_unknown_code` — direct service-layer tests.
- `test_get_plans_endpoint_returns_the_seeded_plans` — real HTTP API test, including confirming `monthly_price_cents` is honestly `None`, not fabricated.
- `test_generate_licence_populates_plan_id_matching_the_requested_tier` — full end-to-end regression test through the real submit → review → approve flow, confirming the resulting `Licence.plan_id` resolves to the correct `Plan`.
- `test_migration_backfills_plan_id_for_a_licence_that_predates_it` — the highest-value test in this set: downgrades one revision, inserts a raw `Licence` row via SQL (simulating a licence that predates this migration, with only `tier` set), upgrades back to head, and confirms `plan_id` was correctly backfilled from that pre-existing tier string.

---

## 4. Validation

- **Backend:** full suite — 277/277 passing (271 before this workstream, +6 new). Also specifically re-ran every licensing/entitlement-adjacent suite (`test_licensing.py`, `test_entitlements.py`, `test_commercial_provisioning.py`, `test_activation.py`, `test_marketplace.py` — 73/73 passing) given this workstream's load-bearing risk profile.
- **Frontend:** 302/302 passing, unaffected — no frontend code changed.
- Migration verified three times: the standard isolated-schema upgrade/downgrade test, the dedicated backfill-simulation test, and a direct application to the real dev database.

---

## 5. Commit status

Backend and frontend (governance docs) changes complete and tested, ready to commit locally. **Not pushed** — per instruction ("Commit locally only... Hold for review when both are complete").
