# Phase 0 Package J: Sales & Customer Success Platform — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package J only, extending Package I (Department Head Layer & Executive Organisation, `350e37f` backend / `0ee8ce3` frontend) and Package H (Knowledge & Memory Intelligence).

---

## 1. Scope and the design decisions this package was built against

Like Packages G–I, this package had no pre-existing `*_MVP_V1.md` design document. Package I's own `HEAD_OF_SALES_WORKER.md`/`HEAD_OF_CUSTOMER_SUCCESS_WORKER.md` are deliberately advisory-only executive personas — this package builds the operational layer those two personas' own docs explicitly declined to be. Four design decisions were confirmed with the user before any code was written:

1. **One `CrmContact` entity with a `stage` field** (prospect → lead → customer), not separate Prospect/Lead/Customer tables — the same "reuse one entity, add a field" preference `Department`/`Worker` already established for the Department Head layer. Proposals, quotes, contracts, and onboarding tasks all link to this one row.
2. **Three separate entities — `Proposal`, `Quote`, `Contract`** — each its own table with an independent submit → admin-decide lifecycle, rather than one entity with more states, so a contract can be revisited without re-litigating the original proposal's approval.
3. **A new nullable `Department.function` column** (`"sales"` | `"customer_success"` | `null`) so the executive dashboard can identify the right department reliably rather than guessing from free-text name/description.
4. **A cosmetic CRM connector abstraction layer**, mirroring Package 8's Connectors precedent exactly — never wired to anything real. The native Lead/Proposal/Customer CRUD this package builds does not route through this layer at all.

**Governance mapping, decided during planning, not asked as a fork:** "human approval for financial commitments" is satisfied by Quote/Contract's own approval gate (their `amount` field is part of the same gate) — no fourth, separate financial-commitment entity was built, the same "map the rule to an already-covered mechanism" practice Package I used. "Human contact remains part of customer acquisition" is satisfied trivially: this backend has no outbound email/SMS/contact-automation capability shipped in any prior package, so no code path could contact a prospect without a human. Only **proposal drafting** gets an AI-assist (gated by a new `sales_intelligence` capability, Enterprise+) — quotes and contracts are always human-entered, since a made-up number is a materially different risk from a made-up paragraph of prose.

**Backend:** 10 modified, 21 new. **Frontend:** 10 modified, 21 new. Nothing committed in either repository, per this series' convention.

## 2. Files created/changed (backend)

**New models:** `models/{crm_contact,proposal,quote,contract,onboarding_task,crm_audit_log}.py`. **New schemas:** the matching six under `schemas/`. **New services:** `services/{crm_contact_service,proposal_service,quote_service,contract_service,onboarding_service,crm_pipeline_service,crm_connector_status_service}.py`, `services/crm_connectors/{base_connector,salesforce_connector,hubspot_connector}.py`. **New API routers:** `api/{crm_contacts,proposals,quotes,contracts,onboarding_tasks,crm_pipeline,crm_connectors}.py`. **New migration:** `alembic/versions/fd7dd57780a1_...py`. **New tests:** `tests/test_crm.py`.

**Modified:** `models/department.py` (+ nullable `function` column), `schemas/department.py` (+ `function` field, new `DepartmentFunctionAssignment`), `services/department_service.py` (+ `set_department_function()`), `services/entitlement_service.py` (+ `sales_intelligence` capability), `api/departments.py` (+ `PATCH /departments/{id}/function`), `main.py` (seven new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the six new models).

## 3. Sales Manager worker and Customer Success Manager worker (objectives #1–#2)

Two new worker-catalogue entries (`docs/workforce/{SALES_MANAGER_WORKER,CUSTOMER_SUCCESS_MANAGER_WORKER}.md`) — deliberately distinguished from Package I's Head of Sales/Head of Customer Success as the **operational, "doer" counterparts**: the personas that actually drive the `CrmContact`/`Proposal`/`OnboardingTask` workflows this package builds, rather than advising on them. Neither is a backend-enforced worker "type" — like every worker in this catalogue, they are plain `Worker` rows (`name`/`role`/`purpose`/`instructions`); the distinction is documentation and product-persona, not a schema field.

## 4. Lead management, prospect intake, customer lifecycle tracking (objectives #3, #4, #7)

`CrmContact.stage` (`prospect`|`lead`|`customer`) is the single field carrying a contact through its whole life. `services/crm_contact_service.py#update_stage()` enforces a forward-only (or lateral/no-op) transition via a plain, explicitly-checked list — no DB-level state machine — rejecting any backward move with a `400`. `POST /crm/contacts/` (prospect intake) and `PATCH /crm/contacts/{id}/stage` (lead management/progression) are both open to any org member, the same "structural CRUD is ungated" posture Workers/Knowledge/Departments already established. `health_status` (nullable, meaningful once `stage == "customer"`) backs customer lifecycle tracking.

## 5. Proposal-request workflows and the governance approval gates (objective #5, governance)

`Proposal`/`Quote`/`Contract` each: `POST /{resource}/` creates and submits in one step for the manual-entry path (`status` starts `"submitted"`); `POST /{resource}/{id}/decide` (admin-only — `require_role("admin")`) is the human-approval gate itself, setting `status` to `approved`/`rejected` and recording `decided_by_user_id`/`decided_at`/`decision_notes`. Proposals additionally support `POST /proposals/draft` (gated by `sales_intelligence`) — generates `content` via a real Ollama call (`services/proposal_service.py#draft_proposal()`, reusing `services/context_builder.py#build_context()` for the drafting worker's own persona/knowledge/memory) and persists a `"draft"`-status row a human must still explicitly `POST /proposals/{id}/submit` before it can be decided on. Quotes and contracts have no equivalent draft path — `content`/`amount` are always human-entered, per the confirmed design decision. Every decision writes a `CrmAuditLog` row (`proposal_submitted`/`proposal_decided`, etc.), verified live (§9) to record the complete transition history for a real contact lifecycle.

## 6. Customer onboarding workflows (objective #6)

`services/onboarding_service.py#seed_default_onboarding_tasks()` creates a fixed, four-item deterministic checklist (Welcome call, Account setup, Training session, 30-day check-in) — no LLM involved, the same "never AI-authored" discipline this package applies to financial documents, extended here to onboarding structure. `POST /onboarding-tasks/seed`, `PATCH /onboarding-tasks/{id}/complete` are both open to any org member. No hard requirement exists that these tasks must be seeded, or completed, before a contact is considered a customer — a soft, documented convention only, per this series' preference for simple, testable rules over rigid state machines.

## 7. CRM integration points and abstraction layer (objective #8)

`services/crm_connectors/base_connector.py#BaseCrmConnector` mirrors `services/connectors/base_connector.py` exactly (`connect()`/`sync()` raise `NotImplementedError`, `status()` returns `{"status": "not_implemented"}`); `SalesforceConnector`/`HubspotConnector` mirror the `SharePointConnector` et al. stub shape exactly, overriding only `connect()`/`sync()` with hardcoded dicts. `api/crm_connectors.py` (`GET /crm-connectors/{salesforce,hubspot}`, `GET /crm-connectors/status`) returns hardcoded `"coming_soon"` responses — the connector classes themselves are never imported by any router, dead code by design, identical to Package 8's own connector classes. This package's native CRM functionality does not route through this abstraction at all.

## 8. Executive visibility of pipeline and customer health; Department Head integration (objectives #9, #10)

`services/crm_pipeline_service.py#get_pipeline_summary()` returns fully-keyed stage counts, health counts, and pending-decision counts for proposals/quotes/contracts — `GET /crm/pipeline-summary` (any org member). `Department.function` (objective #10's integration point) lets the frontend identify which department's dashboard should show which widget; `PATCH /departments/{id}/function` (admin-only) mirrors the existing `/head` endpoint's shape exactly. This backend package makes no distinction between a "sales" and a "customer_success" department beyond storing the tag — the dashboard-widget selection logic lives entirely in the frontend (see the frontend report §7).

## 9. Validation

### Build
`python -c "import main"` succeeds; every new endpoint confirmed present via the app's own OpenAPI schema (`/contracts/`, `/crm/contacts/`, `/crm/pipeline-summary`, `/crm-connectors/*`, `/onboarding-tasks/*`, `/proposals/{draft,submit,decide}`, `/quotes/*`, `/departments/{id}/function`).

### Tests
`python -m pytest tests/` — **141 passed** (10 new Package J tests — 3 unit tests for `_is_legal_stage_transition` covering forward moves including skipping "lead", the same-stage no-op, and rejected backward moves; 5 cheap gating/isolation tests covering admin-only decisions on all three approval entities, cross-org contact isolation, the `sales_intelligence` tier gate, and `PATCH /departments/{id}/function` admin-gating; 2 real-Ollama tests — one AI-drafted proposal, and one full contact-lifecycle integration test (manual submission throughout, so it needs no Ollama call of its own) confirming `crm_audit_log` recorded all ten expected event types for a single contact's full journey). All 131 pre-existing tests (Packages 1/2/A–I) pass unmodified.

### Migration verification
Generated via `alembic revision --autogenerate`; unlike every prior ALTER-heavy migration in this series, this one needed no hand-fix for an unnamed FK constraint — `departments.function` has no FK, and every new table's FKs are inline `CREATE TABLE` constraints (auto-named is fine when the whole table is dropped on downgrade, only `ALTER TABLE ADD CONSTRAINT` needs an explicit name for a later `DROP CONSTRAINT`). Isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly. Applied to the real dev database.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database and the genuinely-running local Ollama instance. Signed up a fresh customer, seeded a real staff user, approved a real Enterprise licence, created a Sales department and a Customer Success department and set each one's `function`, created a Sales Manager worker and a Customer Success Manager worker as members of the respective departments. Then, all against the live HTTP API and the real frontend:

- Created a prospect via intake, promoted it to lead.
- Generated a real AI-drafted proposal (~19 seconds) — genuine, coherent, on-brief prose, correctly left in `"draft"` status until explicitly submitted.
- Submitted the proposal, confirmed a `member` user is `403`'d attempting to decide it, then approved it as admin.
- Submitted and approved a quote (linked to the approved proposal) and a contract (linked to the approved quote) the same way, confirming the `member`-403/admin-200 pattern on both.
- Marked the contact `customer`, set its health to `healthy`, seeded the default onboarding checklist, and completed one task.
- Confirmed `GET /crm/pipeline-summary` correctly reported one customer, one healthy contact, and zero pending decisions (everything already resolved).
- Confirmed the real frontend's Sales and Customer Success department dashboards each rendered their respective widget (pipeline funnel vs. customer health) and that the admin-only department-`function` dropdowns rendered on the admin departments page.
- Confirmed via the frontend's own BFF proxy routes that a `member` can create a contact and submit a proposal, but is `403`'d attempting to decide one — the governance gate holds through the full stack, not just the direct backend API.

All verification data (the test organisation, its two users, both departments, both workers, the contact, all proposal/quote/contract/onboarding/audit rows, the licence/licence request/entitlement, and the seeded staff user) was deleted from the real dev database afterward; both temporary server instances were stopped, confirmed by a follow-up `curl` against both ports returning connection-refused.

## 10. Explicitly not done

- No real external CRM sync (Salesforce/HubSpot) — stub connectors only, per the confirmed design decision.
- No AI-drafted quotes or contracts — only proposals get the optional draft-assist; amounts and terms are always human-entered.
- No hard DB-enforced requirement that a Contract must exist before marking a contact `customer`, or that onboarding tasks must exist before a contact is considered fully onboarded — soft, documented conventions only.
- No outbound customer-contact automation (email/SMS) of any kind — none exists anywhere in this backend today; this package does not introduce the first one.
- No change to CTO Orchestration's `_pick_worker_for_subtask()` — `Department.function` is a dashboard/routing-identity signal in this package, not a delegation-matching one; noted as a candidate for later, not built here.
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention.
