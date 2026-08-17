# Phase 0 Package L: Federation Registry & External AI Consulting — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package L only, extending Package K (Marketing & Media Platform, `7dd98ff` backend / `d2fa89a` frontend) and reusing Package F/I's consult-then-synthesise mechanism (`services/orchestration_service.py`).

---

## 1. Scope and the design decisions this package was built against

A repo-wide search confirmed "Federation" was entirely greenfield before this package — zero references anywhere in either repo, no partial design to correct. Four design decisions were confirmed with the user before any code was written:

1. **The provider layer is a cosmetic stub**, mirroring Packages 8/J/K's connector precedent exactly. Unlike those packages — each of which had a real *native* feature that worked regardless of the stub — Federation's whole point is the consultation experience itself, so the surrounding registry/confidence/selection/audit machinery is genuinely real and working; only the literal external HTTP call is simulated.
2. **Confidence is a deterministic keyword-overlap heuristic**, not a model-generated score — reusing `services/orchestration_service.py#significant_words()`, the same "algorithm over model judgment" principle this project's own `_pick_worker_for_subtask()`/`suggest_consultation()` already apply.
3. **Federation gates at Platinum, alongside `cto_orchestration`/`orchestration_intelligence`** — the existing ceiling of `_TIER_ORDER`. No new tier was introduced.
4. **Cost/usage tracking is scoped to federation calls only** — `services/ollama_service.py`, used by every other package, is untouched.

No adjacent worker persona exists to retrofit (unlike Package K's Marketing Manager retrofit) — Federation is infrastructure available to any owned worker's consultation flow, mirroring exactly how Package F's original consult-then-synthesise mechanism works for any worker before Package I narrowed a *second* entry point to department heads only. No new worker persona was introduced.

**Governance mapping, decided during planning, not asked as a fork:** "use Teracom capabilities first / consult federation only when confidence is insufficient or specialist expertise is required" reuses the exact suggest-then-confirm shape `/orchestration/suggest` → `/orchestration/consult` already established — the confirm action still permits a human to name a specific provider even when confidence was fine (the "specialist expertise required" clause), consistent with this project's standing "the human decides, the system informs" pattern. "No external model may commit commercial, contractual, or financial actions" is satisfied the same way ADR-013/014 already established for this exact class of rule — no code path anywhere in this backend lets AI-generated text execute a commercial/financial action, and this holds doubly here since no real external model is even called. "Federation activity must be auditable" is `FederationAuditLog`, mirroring the four existing audit-log models' shape exactly. "Federation governance controls" (objective #6, its own concrete deliverable) is a new admin-only, per-organisation toggle — `Organisation.federation_enabled` + `PATCH /organisations/federation-enabled`, mirroring the existing `PATCH /organisations/industry` endpoint's exact shape.

**Backend:** 6 modified, 12 new. **Frontend:** 8 modified, 15 new. Nothing committed in either repository, per this series' convention.

## 2. Files created/changed (backend)

**New models:** `models/{federation_provider,federation_consultation,federation_audit_log}.py`. **New schemas:** the matching four under `schemas/` (including `schemas/federation_summary.py`). **New services:** `services/{federation_provider_service,federation_service,federation_summary_service}.py`, `services/federation_providers/{base_connector,openai_connector,anthropic_connector,azure_openai_connector}.py`. **New API routers:** `api/{federation_providers,federation_consultations,federation_summary}.py`. **New migration:** `alembic/versions/17aa7e1b195b_...py` (also seeds the registry with 3 rows — a data migration, not just schema). **New tests:** `tests/test_federation.py`.

**Modified:** `models/organisation.py` (+ nullable-`false`, default-`true` `federation_enabled` column), `schemas/organisation.py` (+ `federation_enabled` field, new `FederationEnabledUpdate`), `api/organisations.py` (+ `PATCH /organisations/federation-enabled`), `services/entitlement_service.py` (+ `federation_consultation` capability at Platinum), `main.py` (three new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the three new models).

## 3. Federation Registry and model capability catalogue (objectives #1, #2)

`FederationProvider` is a global, non-organisation-scoped reference catalogue — the same precedent `models/marketplace_listing.py` already set for shared platform data. `capabilities` (a JSONB list of tag strings) is this package's entire "model capability catalogue" — a field on the registry entry itself, per this project's "reuse one entity, add a field" preference, rather than a second table. The migration seeds three illustrative rows (OpenAI GPT-4, Anthropic Claude, Azure OpenAI), each `status="coming_soon"`, so `GET /federation/providers` returns real data from day one with no admin bootstrapping needed — verified live (§9).

## 4. Provider abstraction layer (objective #3)

`services/federation_providers/base_connector.py#BaseFederationConnector` mirrors `services/media_connectors/base_connector.py` (Package K) exactly — `connect()`/`sync()` raise `NotImplementedError`, `status()` returns `{"status": "not_implemented"}`. Three stub subclasses mirror the pattern. Unlike every prior connector family in this project, this one is never imported by the real consult flow either — `services/federation_service.py#consult_federation()` calls `generate_response()` directly, not this dead-code layer, per the confirmed design decision.

## 5. AI consultation workflows; worker-to-federation consultation; provider selection logic; confidence-based escalation (objectives #4, #5, #7, #8)

`services/federation_service.py#compute_confidence()` — the ratio of a message's significant words that overlap with the target worker's own `role`/`purpose`, clamped to `[0, 1]` by construction (an all-stopword message returns `1.0` rather than an undefined ratio). `select_provider()` — the same best-overlap-candidate-loop shape as `suggest_consultation()`, matched against each provider's `display_name` + `capabilities`, falling back to the first registered provider (stable order) when nothing overlaps. `suggest_federation_escalation()` (free, no Ollama call) checks the tier gate and `federation_enabled` first, then computes confidence and decides `suggested = confidence < 0.35`, logging a `federation_escalation_suggested` audit event whenever a provider is actually surfaced. `consult_federation()` (the confirm action) resolves the given provider or falls back to selection, builds a prompt via `build_context(worker.id, db)` framing the escalation transparently, and calls `generate_response()` for the actual answer — always persisted with `is_simulated=True`.

## 6. Federation governance controls (objective #6, governance)

`Organisation.federation_enabled` (Boolean, server-default `true`) + `PATCH /organisations/federation-enabled` (admin-only) mirrors `set_organisation_industry`'s exact shape. Both `suggest_federation_escalation()` and `consult_federation()`'s callers (the API routers) check this flag in addition to the tier gate — verified live: disabling it as admin blocked both `/federation/suggest` (`available: false`) and `/federation/consult` (`403`) even on a Platinum-tier organisation (§9).

## 7. Cost and usage tracking foundation (objective #9)

`FederationConsultation.estimated_tokens`/`estimated_cost` — a word-count-based token estimate (`len(response.split()) * 1.3`, documented as approximate) multiplied by the selected provider's own `cost_per_1k_tokens` reference rate. Explicitly a simulated foundation, not real metering — there is no real external billing to measure, since no real external provider call exists.

## 8. Executive visibility of federation activity (objective #10)

`services/federation_summary_service.py#get_federation_summary()` returns fully-keyed per-provider consultation counts (every registered provider present, zero-filled), total consultations, total estimated cost, and suggested-vs-actioned counts from the audit log — `GET /federation/summary` (any org member, read-open like `crm_pipeline`/`marketing_summary`).

## 9. Validation

### Build
`python -c "import main"` succeeds; every new endpoint confirmed present via the app's own routes (77 total routes after registration).

### Tests
`python -m pytest tests/` — **161 passed** (9 new Package L tests — 3 unit tests for `compute_confidence()` covering a high-overlap message, a zero-overlap message, and an all-stopword message; gating/isolation tests covering the `federation_consultation` tier gate on both `/suggest` and `/consult`, the `federation_enabled` toggle disabling both even on Platinum, `PATCH /organisations/federation-enabled` admin-only gating, cross-org isolation, and open registry-read access; one real-Ollama test exercising a full `/federation/suggest` → `/federation/consult` flow, confirming `is_simulated`, populated estimated tokens/cost, the audit trail, and the summary). All 152 pre-existing tests (Packages 1/2/A–K) pass unmodified.

### Migration verification
Generated via `alembic revision --autogenerate` (`down_revision = 'fee80d90d0de'`, Package K's head); like Package K's own migration, no hand-fix was needed for an unnamed FK constraint. The seed-data insert (`op.bulk_insert`) was added by hand after autogenerate, using the JSONB column's native list handling (not a pre-serialized JSON string, which would have double-encoded). `tests/test_migrations.py`'s isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly, including the seed rows. Applied to the real dev database; confirmed the 3 seed rows landed correctly with proper JSONB arrays.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database and the genuinely-running local Ollama instance. Signed up a fresh customer, seeded a real staff user, approved a real Platinum licence, confirmed `GET /federation/providers` returned the 3 seeded rows. Created a worker with a narrow purpose ("Answer customer onboarding and account setup questions"). Then, all against the live HTTP API and the real frontend:

- As a `member`, checked confidence for a message clearly outside the worker's purpose ("What is the best cryptographic approach for enterprise network segmentation and coding a secure API gateway?") — confidence computed as `0.00`, correctly suggesting escalation, with Azure OpenAI sensibly matched on its `coding`/`enterprise_integration` capability tags.
- As the same `member`, consulted federation against that suggested provider (~43 seconds) — a genuine, detailed, on-topic answer in the voice of "Azure OpenAI" (zero-trust segmentation, TLS, API Management, Key Vault), correctly `is_simulated: true`, with `estimated_tokens: 419` and `estimated_cost: 0.0084` populated.
- Confirmed `GET /federation/summary` correctly reported 1 total consultation, 1 against Azure OpenAI (0 for the other two providers — fully keyed), 1 suggested and 1 actioned escalation.
- Confirmed `federation_audit_log` recorded both `federation_escalation_suggested` and `federation_consult_completed` for this consultation.
- Confirmed a `member` is `403`'d attempting `PATCH /organisations/federation-enabled`, while an admin succeeds.
- As admin, disabled `federation_enabled` — confirmed `/federation/suggest` then returned `available: false` and `/federation/consult` `403`'d, even though the organisation's tier was still Platinum — then re-enabled it.
- Confirmed via the frontend's own BFF proxy routes that a `member` can call `/api/portal/federation/suggest` successfully but is `403`'d attempting `/api/portal/organisations/federation-enabled` — the governance gate holds through the full stack, not just the direct backend API.
- Confirmed the real frontend's `/portal/federation`, `/portal/cto`, and `/portal/admin/organisation` pages all rendered correctly (the registry, the consultation history section heading, the federation summary widget's own heading text, and the enabled-toggle's own label all present in the rendered HTML).

All verification data (the test organisation, its two users, the worker, the one federation consultation, all federation audit log rows, the licence/licence request/entitlement, and the seeded staff user) was deleted from the real dev database afterward; both temporary server instances were stopped — the `next-server` child again required an explicit `kill -9` after `pkill -f "next start"` only killed the wrapper, the same known quirk from prior packages — confirmed by a follow-up `curl` against both ports returning connection-refused.

## 10. Explicitly not done

- No real external provider API call — every "federation response" is generated locally via Ollama, always marked `is_simulated: true`; the connector-stub classes are dead code, per the confirmed design decision.
- No new pricing tier above Platinum — Federation gates at the existing ceiling, alongside `cto_orchestration`/`orchestration_intelligence`.
- No retrofit of `services/ollama_service.py`'s own discarded token/usage fields for non-federation calls — this package's usage/cost tracking is scoped to federation consultations only, per the confirmed decision.
- No new worker persona — Federation is infrastructure available to any owned worker's consultation flow, not a dedicated persona.
- No `Department.function` integration — Federation is an organisation-wide capability, not department-shaped.
- No admin CRUD for the provider registry — the 3 seed rows are a fixed, hand-authored illustrative catalogue, not customer-manageable.
- No update or delete endpoint for `FederationConsultation` — same standing "create and read only" gap this project has repeatedly flagged, now on a fifth data model.
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention.
