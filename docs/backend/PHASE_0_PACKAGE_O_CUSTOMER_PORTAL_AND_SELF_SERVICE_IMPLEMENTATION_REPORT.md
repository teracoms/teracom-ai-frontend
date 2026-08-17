# Phase 0 Package O: Customer Portal & Self-Service Platform — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package O only, originating this backend's first identity plane scoped narrower than an organisation, structurally modelled on the `staff_users` plane (Phase 0, cross-tenant) even though it solves the opposite scoping problem, and extending Package N's `Project`/`Task` model and Package J's `CrmContact`/`Proposal`/`Quote`/`Contract`/`OnboardingTask` models with new, additive read paths.

---

## 1. Scope and the design decisions this package was built against

Every prior package built tools for an organisation's own internal users. Research confirmed no precedent anywhere in this codebase for an identity scoped narrower than an organisation — the only adjacent precedent, `staff_users`, goes the opposite direction (broader, cross-tenant, for Teracom's own employees). Four design decisions were confirmed with the user before any code was written:

1. **A new admin-created, password-based login** (`PortalContact`, one per `CrmContact`) — mirrors how internal users are created today (`POST /users/`, admin sets the password directly; no email-sending capability exists anywhere in this backend for self-signup or invites).
2. **One unified ticket + thread model** for support requests, incident reports, and the communications timeline — a single `SupportRequest` table (`request_type`: `"support"`|`"incident"`) plus one `SupportRequestMessage` thread table, whose aggregated content across a contact's own requests is the timeline.
3. **Automatic Operations Task creation on incident submission** — the literal reading of governance's "incident reports create operations workflows" (not "may create").
4. **A distinct route group, cookie, and non-overloaded naming** — this codebase's own docs already use "customer" to mean the paying organisation and "staff" to mean Teracom's own employees. The new plane is named `PortalContact` throughout code and internal docs.

**The concrete mechanism behind "customers may view their own information only" is a distinct response shape, not just a query filter.** `schemas/portal_contact_view.py`'s `PortalProposalView`/`PortalQuoteView`/`PortalContractView` deliberately omit `internal_cost_estimate`, `decision_notes`, and internal user ids — fields the existing internal response schemas carry. This makes leaking internal-only fields to a customer structurally impossible, not a matter of remembering to filter correctly at every call site.

Two further additive design calls made during planning, not asked as forks: `Project` gained a nullable `crm_contact_id` (staff may link a project to the customer it's being delivered for — the mechanism behind customer-facing project visibility/progress), and `Knowledge` gained a nullable `customer_visible` boolean (self-service knowledge access, reusing the existing model). `Project.created_by_user_id` was loosened to nullable to accommodate the one system-created "Customer Incidents" Project, which has no human creator.

**No new tier-gated capability was needed.** Every objective in this package is either human-entered structured data, a read-only view, or a message post — nothing here is AI-generated, and no Ollama call exists anywhere in this package's own new code.

**Backend:** 8 modified, 12 new. Nothing committed in either repository, per this series' convention.

## 2. Files created/changed (backend)

**New models:** `models/{portal_contact,support_request,support_request_message}.py`. **New auth:** `auth/{portal_contact_security,portal_contact_dependencies}.py`. **New schemas:** `schemas/{portal_contact,portal_contact_view,support_request}.py`. **New services:** `services/{portal_contact_service,portal_contact_view_service,support_request_service}.py`. **New API routers:** `api/{portal_contact_auth,portal_contact_self,portal_contact_support_requests,support_requests}.py`. **New migration:** `alembic/versions/06b786f413d9_...py`. **New tests:** `tests/test_customer_portal.py`.

**Modified:** `config.py` (+ `PORTAL_CONTACT_JWT_AUDIENCE`), `models/project.py` (+ nullable `crm_contact_id`; `created_by_user_id` loosened to nullable), `models/task.py` (+ nullable `support_request_id`), `models/knowledge.py` (+ `customer_visible` boolean), `schemas/project.py` (+ `crm_contact_id`; `created_by_user_id` now optional), `services/project_service.py` (+ `list_projects_for_contact()`, `get_or_create_incident_project()`), `services/task_service.py` (unchanged signature, reused by `support_request_service.create_support_request()`), `services/knowledge_service.py` (+ `list_customer_visible_knowledge()`), `services/crm_pipeline_service.py`/`schemas/crm_pipeline.py` (+ `portal_accounts_count`/`open_support_requests_count`), `api/crm_contacts.py` (+ `POST`/`GET /crm/contacts/{id}/portal-account`), `main.py` (four new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the three new models).

## 3. Customer Portal identity plane

`models/portal_contact.py`'s `PortalContact` mirrors `models/staff_user.py`'s shape (separate table, no shared `organisation_id`-scoping assumption with `users`) but is scoped the opposite direction: `crm_contact_id` is **unique** (one login per contact) and `organisation_id` is denormalized for isolation queries. `auth/portal_contact_security.py` mirrors `auth/staff_security.py` exactly — same HS256 key, distinct `aud` claim (`PORTAL_CONTACT_JWT_AUDIENCE`), same two-check verification discipline. `auth/portal_contact_dependencies.py#get_current_portal_contact()` is a separate function, never sharing a code path with `get_current_user`/`get_current_staff`, and resolves to `{id, email, crm_contact_id, organisation_id}` — every downstream route filters on `crm_contact_id`, not just `organisation_id`. `POST /crm/contacts/{id}/portal-account` (admin-only) is the one creation path; `GET /crm/contacts/{id}/portal-account` (any org member) returns `null`, not 404, when none exists yet.

## 4. Customer-facing read surfaces (objectives #1-#6, #9, #11, #13)

`api/portal_contact_self.py` exposes `GET /portal-contact/{dashboard,proposals,quotes,contracts,onboarding-tasks,projects,communications,knowledge}` — all portal-contact-auth-gated, all read-only. `services/portal_contact_view_service.py` reuses Package J's existing `list_proposals_for_contact()`/`list_quotes_for_contact()`/`list_contracts_for_contact()`/`list_tasks_for_contact()` directly (no rewrite) and maps each row into its slim `Portal*View` schema. `get_projects_with_progress()` computes `task_progress` (`{total, done, percent}`) live from Package N's `Task` rows — never stored. Objective #13 (health/engagement metrics) extends `crm_pipeline_service.get_pipeline_summary()` with `portal_accounts_count`/`open_support_requests_count` rather than building a second dashboard.

## 5. Support requests, incidents, and the communications timeline (objectives #7, #8, #10)

`services/support_request_service.py#create_support_request()` is the one creation path (portal-contact-auth-gated, `api/portal_contact_support_requests.py`). For `request_type == "incident"`, it calls `services/project_service.py#get_or_create_incident_project()` (looks up an organisation-scoped Project named "Customer Incidents" with `department_id IS NULL`, creates one if absent) and `services/task_service.py#create_task()` to create a real Task, stamping `SupportRequest.operations_task_id`. `services/portal_contact_view_service.py#get_communications_timeline()` aggregates every `SupportRequestMessage` across a contact's own requests, sorted chronologically — no separate timeline table exists. Staff manage requests via `api/support_requests.py` (any org member, ungated — same posture as Package N's `Task`/`Project`).

## 6. Validation

### Build
`python -c "import main"` succeeds; every new endpoint confirmed present.

### Tests
`python -m pytest tests/` — **176 passed** (7 new Package O tests: admin-only portal-account creation gate; the GET portal-account lookup correctly returning `null` before creation; a portal contact only ever seeing its own `crm_contact_id`'s data, with cross-contact attempts on both proposals and support requests correctly `403`'d; `internal_cost_estimate`/`decision_notes`/`requested_by_user_id` structurally absent from the raw JSON keys of a portal-facing proposal payload; an incident automatically creating exactly one Task under an auto-created-and-reused "Customer Incidents" Project; a two-directional support-request message thread verified from both the portal-contact and staff-facing endpoints; and one full integration test confirming `GET /crm/pipeline-summary`'s new fields and `GET /operations/summary`'s task counts both reflect real, live-created data). All 169 pre-existing tests (Packages 1/2/A–N) pass unmodified.

### Migration verification
Generated via `alembic revision --autogenerate` (`down_revision = 'a280cff0e769'`, Package N's head). **One ordering issue required a hand fix**: the pre-existing "departments, hardware_fingerprints, licences, workers" FK-cycle (a known, already-flagged `SAWarning` in `alembic/env.py`) pulled the new `support_requests` table into its unsortable group once it referenced the pre-existing `tasks` table, which in turn caused autogenerate to emit `create_table('support_requests', ...)` — which references `portal_contacts` — *before* `create_table('portal_contacts', ...)` itself. Reordered by hand so every table is created only after its own FK targets exist (`portal_contacts` → `support_requests` → `support_request_messages`), with the downgrade's drop order reversed to match. A second, separate issue — `op.create_foreign_key(None, ...)` generates an unnamed constraint Postgres auto-names, which `op.drop_constraint(None, ...)` then cannot resolve at downgrade time — was fixed by naming both new FK constraints explicitly (`fk_projects_crm_contact_id_crm_contacts`, `fk_tasks_support_request_id_support_requests`). `tests/test_migrations.py`'s isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly after both fixes; the flawed intermediate state was unwound via direct SQL and `alembic_version` reset before re-verifying, since the round trip is destructive to a dev database's already-applied state. Applied to the real dev database.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database. Created an organisation and two `CrmContact`s, granted each its own `PortalContact` account as admin. Then, all against the live HTTP API and the real frontend:

- Logged in as each portal contact independently; confirmed contact A's session could only ever see contact A's proposals/support-requests, and a direct id-manipulation attempt against contact B's support request returned `403`.
- Set a proposal's `internal_cost_estimate` as staff, then confirmed the identical proposal's portal-facing JSON payload contained no `internal_cost_estimate`, `decision_notes`, or `requested_by_user_id` key at all — inspected the raw response, not just the rendered UI.
- Submitted a `"support"` request and an `"incident"` request as a portal contact — confirmed the incident produced a real `Task` under an auto-created "Customer Incidents" `Project`, visible in `GET /operations/summary`'s counts, and that a second incident reused the same Project.
- Posted a message as the portal contact, then replied as a staff `member` via the staff-facing endpoint — confirmed both the portal-contact-side and staff-side message-list endpoints showed both messages in the correct order.
- Confirmed `GET /crm/pipeline-summary`'s new `portal_accounts_count`/`open_support_requests_count` fields matched the real counts created during this walkthrough.
- Confirmed via the frontend's own BFF proxy routes that the admin-only portal-account creation gate and the ungated staff support-request status/reply routes both hold through the full stack, not just the direct backend API.

All verification data (both test organisations, their contacts, portal accounts, support requests, messages, and the auto-created Project/Task) was deleted from the real dev database afterward via direct SQL in FK-dependency order; both temporary server instances were stopped — the `next-server` child again required an explicit `kill -9` after `pkill -f "next start"` only killed the wrapper, the same known quirk from every prior package — confirmed by a follow-up `curl` against both ports returning connection-refused.

## 7. Explicitly not done

- No self-service signup, password reset, or email-based invite for `PortalContact` accounts — no email-sending capability exists anywhere in this backend; the admin sets and shares the initial password directly.
- No multi-user-per-customer model — exactly one `PortalContact` per `CrmContact`.
- No update or delete on `SupportRequest`/`SupportRequestMessage` beyond status transitions and appending new messages — same standing "create and read/decide only" gap, now on a ninth/tenth data model.
- No customer-facing write capability on `Proposal`/`Quote`/`Contract`/`OnboardingTask` of any kind — strictly read-only, per governance.
- No new tier-gated capability, and no new worker-catalogue persona.
- No department-scoping analogue for `SupportRequest` — organisation + contact scoped only, consistent with `CrmContact` itself never being department-scoped.
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention.
