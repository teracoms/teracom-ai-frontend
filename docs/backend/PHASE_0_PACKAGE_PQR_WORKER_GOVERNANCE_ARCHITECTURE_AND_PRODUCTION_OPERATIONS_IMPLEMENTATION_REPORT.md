# Phase 0 Package PQR: Worker Lifecycle & Governance + Architecture Integration + Production Operations — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** a combined package spanning three distinct concerns — worker lifecycle/governance, architecture-rule integration, and a new organisation-scoped Production Operations platform. Extends ADR-013 (worker creation approval), reuses Package K's `MediaCentreItem` two-step gate shape (deployment governance), and closes a gap flagged since Package J and reflagged at K/M/N (`Department.function` CTO routing).

---

## 1. Scope and the design decisions this package was built against

Four design decisions were confirmed with the user before any code was written:

1. **A new `WorkerCreationRequest → admin-decide → real Worker` entity** — ADR-013 and `DEPARTMENT_HEAD_LAYER_V1.md` §3 already declared "human approval for new worker creation" satisfied by the pre-existing admin-gated `POST /workers/`. This package's own objectives asked for creation *requests* and *approval workflows* as separate items, so `WorkerCreationRequest` originates a second, optional path — closer in spirit to `LicenceRequest → Licence` than to Proposal/Quote/Contract/DepartmentBudget (which all approve an already-existing row). Direct admin creation via `POST /workers/` is completely unchanged.
2. **A governance policy registry that centralizes the existing binary role model, without retrofitting it everywhere** — research confirmed 24 scattered `require_role("admin")` call sites across 17 files and no role hierarchy (ADR-006). `services/governance_policy_service.py` mirrors `services/entitlement_service.py`'s exact shape. It is the actual enforcement mechanism for this package's own new endpoints; the 24 pre-existing call sites are documented as metadata only, not modified.
3. **A static keyword-boost dictionary for `Department.function` → CTO routing** — the smallest change that closes a three-package-old flagged gap, with zero behaviour change for any department with no `function` tag.
4. **Production Operations is organisation-scoped** — not a new cross-tenant staff-only plane. Each organisation's own environment, relevant given Sovereign/Customer-Hosted editions each run in their own environment, reusing the existing Organisation/User model exactly like every prior package.

**Executive visibility:** one new widget added to the existing `/portal/cto` dashboard, following the established `Promise.allSettled` + one-widget-per-package convention.

**Backend:** 6 modified, 20 new. Nothing committed in either repository, per this series' convention.

## 2. Files created/changed (backend)

**New models:** `models/{worker_creation_request,worker_audit_log,deployment_record,platform_incident,platform_operations_audit_log}.py`. **New schemas:** `schemas/{worker_creation_request,governance_policy,deployment_record,platform_incident,platform_health}.py`. **New services:** `services/{governance_policy_service,worker_creation_request_service,worker_lifecycle_service,deployment_record_service,platform_incident_service,production_platform_health_service}.py`. **New API routers:** `api/{governance_policies,worker_creation_requests,deployment_records,platform_incidents,platform_health}.py`. **New migration:** `alembic/versions/8d46255844ca_...py`. **New tests:** `tests/{test_worker_governance,test_production_operations}.py`.

**Modified:** `api/workers.py` (+ `PATCH /workers/{id}/status`), `services/cto_orchestration_service.py` (+ `_FUNCTION_KEYWORDS`, additive to `_pick_worker_for_subtask()`), `main.py` (five new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the five new models), `tests/test_department_heads.py` (+ 2 new unit tests for the function-routing fix, added to the existing home for `_pick_worker_for_subtask()`'s own test suite rather than a new file).

## 3. Worker lifecycle & creation requests (objectives #1-#3)

`WorkerCreationRequest` mirrors `WorkerCreate`'s own fields exactly, so an approved request maps 1:1 onto a real `Worker`. `services/worker_creation_request_service.py#decide_request()` creates the `Worker` row only on `"approved"` — rejection creates nothing. `PATCH /workers/{id}/status` (admin-only) is the first mutation path for `Worker.status`, which has been a free string with one convention in practice ("active") since Package 1. Both write paths log to the new `WorkerAuditLog`.

## 4. Governance policy engine & authority matrix (objectives #4-#7, #9)

`services/governance_policy_service.py`'s `_ACTION_MIN_ROLE` registers this package's own four new admin-gated actions plus twelve pre-existing ones, confirmed directly against each cited router's source this session. `role_allows_action()` raises `ValueError` for an unregistered action — the same fail-loud discipline `capability_allowed_for_tier()` uses. `GET /governance-policies/` (any org member, read-open) is objective #7's concrete deliverable. **Explicitly not done:** no existing `require_role("admin")` call site was modified — this is a stated scope boundary (see §9), not an oversight.

## 5. `Department.function` → CTO Orchestration routing (objective #8)

`_FUNCTION_KEYWORDS` in `services/cto_orchestration_service.py` is unioned into a department-head candidate's own scored words only when `department.function` is a known value (`sales`, `customer_success`, `marketing`, `finance`, `operations`). Two new unit tests in `tests/test_department_heads.py` (the existing home for this function's own test suite) confirm: a department tagged `function="sales"` with a deliberately generic name/description now routes correctly, and a department with no `function` tag is byte-for-byte unaffected — both run alongside the four pre-existing `_pick_worker_for_subtask()` tests, all of which still pass unmodified.

## 6. Production Operations Platform (objectives #10-#14)

`DeploymentRecord`'s `submit → admin-decide → admin-complete` shape mirrors Package K's `MediaCentreItem` exactly — `complete_deployment()` only accepts a record already `"approved"`, raising otherwise. `PlatformIncident` is ungated create/status (any org member), mirroring Package N's `Task`. `services/production_platform_health_service.py#get_platform_health_summary()` computes `status` (`"operational"`/`"degraded"`/`"outage"`) purely from open `PlatformIncident` severities and `DeploymentRecord` counts — no stored time series, no fabricated metric. **A genuine naming collision was caught and fixed during implementation:** an initial `services/platform_health_service.py` write silently overwrote a pre-existing file (Package 7's own simple per-organisation resource-count check backing `GET /health/`) — caught immediately via `git diff`, restored via `git checkout --`, and the new service renamed to `services/production_platform_health_service.py` to avoid any future collision.

## 7. Objective #15 (executive operations visibility)

`GET /platform-health/summary` is the one endpoint backing the new `PlatformHealthSummaryWidget`, reused unchanged on `/portal/platform-health` and `/portal/cto`.

## 8. Validation

### Build
`python -c "import main"` succeeds; every new endpoint confirmed present.

### Tests
`python -m pytest tests/` — **190 passed** (14 new: 2 unit tests for the `Department.function` routing fix in `tests/test_department_heads.py`, 6 in `tests/test_worker_governance.py` — admin-only worker-creation-request decide gating, approval creating a real Worker, rejection creating none, cross-org isolation, admin-only worker status updates, governance-policy visibility, and a full lifecycle integration test confirming `worker_audit_log` recorded every event type — and 6 in `tests/test_production_operations.py` — the deployment two-step gate including a rejected premature-complete attempt, ungated platform incident create/status, cross-org isolation, and a full lifecycle integration test confirming the health summary's computed status and `platform_operations_audit_log`'s recorded events). All 176 pre-existing tests (Packages 1/2/A–O) pass unmodified, including all four pre-existing `_pick_worker_for_subtask()` tests.

### Migration verification
Generated via `alembic revision --autogenerate` (`down_revision = '06b786f413d9'`, Package O's head) — correctly ordered on the first attempt (no manual fix needed this time, unlike Package O's own migration). `tests/test_migrations.py`'s isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly. Applied to the real dev database.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database. Then, all against the live HTTP API and the real frontend:

- Submitted a worker creation request as a `member`, confirmed `403` deciding it as that same `member`, approved it as admin, confirmed a real `Worker` row now existed with the submitted fields.
- Created a department named generically ("Growth Team") with `function="sales"` and ran a real CTO objective containing a sales-flavoured subtask through `POST /cto/plan` — confirmed it routed to that department's head against real department/worker rows, proving the keyword-boost mechanism works end-to-end, not just at the unit level. Note: `generate_plan()` (backing `/cto/plan`) is purely deterministic decomposition/routing — no Ollama call is made; Ollama is only invoked inside `execute_chain()` (`/cto/execute`), which this check did not need to exercise.
- Submitted, approved, and completed a deployment record — confirmed a premature `complete` call on a merely-`"proposed"` record was rejected with `400`.
- Reported a platform incident as a `member` with no gate, confirmed `GET /platform-health/summary`'s `status` correctly reflected `"outage"` while the incident was open at `critical` severity and reverted to `"operational"` once resolved.
- Confirmed `GET /governance-policies/` listed the full registry including this package's own four new actions.
- Confirmed via the frontend's own BFF proxy routes that the admin-only worker-creation-decide and deployment-decide/complete gates, and the ungated incident-report/status routes, all hold through the full stack, not just the direct backend API.

All verification data was deleted from the real dev database afterward via direct SQL in FK-dependency order; both temporary server instances were stopped — the `next-server` child again required an explicit `kill -9` after `pkill -f "next start"` only killed the wrapper, the same known quirk from every prior package — confirmed by a follow-up `curl` against both ports returning connection-refused.

## 9. Explicitly not done

- No retrofit of the 24 pre-existing `require_role("admin")` call sites onto the new governance policy registry — a deliberate scope boundary, not an oversight (ADR-020).
- No new role granularity — the binary admin/member model is unchanged.
- No real metrics pipeline, time-series storage, or notification/paging system — `platform_health_summary` is a computed snapshot from real rows.
- No cross-tenant/staff-only plane for production operations — organisation-scoped throughout.
- No actual deployment/infrastructure action is ever triggered by any code path in this package.
- No update or delete (or archive) endpoint beyond status/decide transitions on any of the five new entities.
- No new worker-catalogue persona.
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention.
