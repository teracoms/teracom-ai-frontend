# Phase 0 Package N: Operations & Project Delivery Platform — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package N only, extending Package J's `OnboardingTask` shape (Sales & Customer Success Platform, `5725ee4` backend / `13844ae` frontend) rather than Proposal/Quote/Contract/DepartmentBudget's approval shape.

---

## 1. Scope and the design decisions this package was built against

A research pass surfaced the shape of the gap before any code was written: Head of Operations Worker's own doc has always been advisory-only — structurally identical to Head of Sales/Head of Customer Success before Package J, and to CFO Worker before Package M. Project Manager Worker, by contrast, has always had a clear product-facing definition ("planning, sequencing, cross-team coordination") that already described project/task delivery work directly — closer to Marketing Manager Worker's own pre-Package-K shape. This meant the two gaps needed two different, already-established treatments rather than one pattern applied uniformly.

Four design decisions were confirmed with the user before any code was written:

1. **Two parallel tracks: retrofit Project Manager Worker (Package K's pattern) + a new Operations Manager Worker doer under Head of Operations (Package J/M's pattern)** — not a single merged persona, not operations-only.
2. **Data model: new `Project` + `Task` tables, no separate `Milestone` table** — matches this project's "no premature abstraction" convention.
3. **Project/Task creation and status changes are ungated** — any organisation member may create either and change status directly, no admin-decide step. This extends `OnboardingTask`'s existing precedent (Package J) rather than Proposal/Quote/Contract/DepartmentBudget's submit → admin-decide shape, since project/task tracking is operational execution tracking, not a financial or contractual commitment.
4. **`Department.function` gains a fifth value, `"operations"`, for dashboard/identity purposes only** — the standing gap where `Department.function` isn't wired into CTO Orchestration's delegation routing (flagged since Package J, again at K and M) stays deferred.

**One additional design call, made during planning, not asked as a fork:** unlike `CrmContact`/`Campaign` (always organisation-wide, a gap flagged in two prior packages' own risk lists), `Project.department_id` is **nullable** — a project may optionally belong to one department. This closes that previously-flagged gap for this new entity while staying optional so it doesn't force every project into a department.

**No new tier-gated capability was needed.** Every objective in this package is either human-entered structured data or a read-only aggregate — nothing here is AI-generated or model-suggested, and no Ollama call exists anywhere in this package's own new code.

**Governance mapping, decided during planning, not asked as a fork:** nothing in this package's own new code is AI-generated or model-suggested, so no spending/purchasing/signing action exists to gate in the first place — the same posture Package M's finance data took for its own ungated `Proposal.internal_cost_estimate` field.

**Backend:** 4 modified, 15 new. **Frontend:** 7 modified, 16 new. Both repositories committed only after user approval, per this series' convention.

## 2. Files created/changed (backend)

**New models:** `models/{project,task,operations_audit_log}.py`. **New schemas:** `schemas/{project,task,operations_audit_log,operations_summary}.py`. **New services:** `services/{project_service,task_service,operations_summary_service}.py`. **New API routers:** `api/{projects,tasks,operations_summary}.py`. **New migration:** `alembic/versions/a280cff0e769_add_projects_tasks_operations_audit_log.py`. **New tests:** `tests/test_operations.py`.

**Modified:** `main.py` (three new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the three new models).

## 3. Head of Operations Worker / Operations Manager Worker; Project Manager Worker retrofit (the two-track split)

Head of Operations Worker's own scope is unchanged — the "integration" is that its department-head holder can now reference real data via an `"operations"`-function department's dashboard for the first time, the same "real mechanics for the first time" moment Package M gave CFO Worker. `docs/workforce/OPERATIONS_MANAGER_WORKER.md` is the new operational persona actually creating and progressing `Project`/`Task` rows — plain `Worker` rows like every catalogue persona, the distinction is documentation and product-persona, not a schema field. Project Manager Worker's own doc is retrofitted (§1 addition) rather than replaced or split — its existing "planning, sequencing, cross-team coordination" definition now maps onto real mechanics, mirroring Marketing Manager Worker's own Package K retrofit; its contributor-role duties in this repository (§2 of its doc) are unaffected.

## 4. Project/task data model; department budget tracking's ungated counterpart

`Project.status` (`active`|`completed`) and `Task.status` (`pending`|`in_progress`|`done`, mirroring `OnboardingTask` exactly) both change via a direct `PATCH .../status` call open to any organisation member — no admin-decide gate anywhere in this package, the confirmed design. `Task.assignee_worker_id` is an optional FK to `workers.id`, not `users.id` — Workers are this product's operational units, so an assignable-to-a-Worker field fits here unlike the purely human-facing CRM/marketing entities. Every `project_created`/`task_created`/`task_completed` event still writes an `OperationsAuditLog` row despite the ungated design, mirroring `FinanceAuditLog`'s own "audit even when ungated" discipline (Package M logged `proposal_cost_estimated` despite also carrying no gate).

## 5. Organisation-wide and department-scoped visibility (`GET /operations/summary`)

`services/operations_summary_service.py#get_operations_summary()` aggregates project counts by status, task counts by status, and an overdue-task count (`due_date < today` and `status != "done"`) — always fully keyed, the same discipline `finance_summary_service`/`marketing_summary_service` use. `GET /projects/` and `GET /tasks/` both accept an optional scoping query param (`department_id`/`project_id` respectively), omitted meaning organisation-wide — the identical shape `GET /department-budgets/` already established in Package M.

## 6. Validation

### Build
`python -c "import main"` succeeds; every new endpoint confirmed present via the app's own routes.

### Tests
`python -m pytest tests/` — **169 passed** (4 new Package N tests — any-org-member project/task creation and status changes with no 403 anywhere, confirming the ungated design; cross-organisation isolation on projects, tasks, and the summary endpoint; one full integration test — no Ollama call needed, nothing in this package's own code touches it — creating a department with `function="operations"`, a scoped project, three tasks including one overdue, progressing one to `done`, confirming `GET /operations/summary`'s correct rollup including the overdue calculation, and confirming `operations_audit_log` recorded all three event types). All 165 pre-existing tests (Packages 1/2/A–M) pass unmodified.

### Migration verification
Generated via `alembic revision --autogenerate` (`down_revision = '57c3e717878d'`, Package M's head); no hand-fix needed — every new table's FKs are inline `CREATE TABLE` constraints, no unnamed-constraint risk. `tests/test_migrations.py`'s isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly. Applied to the real dev database.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database. Signed up a fresh customer, created an "Operations" department and set its `function` to `"operations"` (confirmed: no schema change needed). Then, all against the live HTTP API and the real frontend:

- Created a project ("Office Relocation") scoped to that department as a `member` — no gate blocked it.
- Created three tasks under that project as the same `member` — "Book movers" (priority `high`), "Sign lease" (`due_date: 2026-08-01`, in the past — deliberately overdue), "Order furniture" — and progressed "Book movers" through `pending → in_progress → done`. No 403 anywhere in this entire flow, confirming the ungated design holds live, not just in tests.
- Confirmed `GET /operations/summary` correctly reported one active project, task counts `{pending: 2, in_progress: 0, done: 1}`, and `overdue_count: 1` — matching the deliberately-overdue "Sign lease" task exactly.
- Confirmed `GET /projects/` (organisation-wide) and `GET /projects/?department_id=...` (scoped) both correctly returned the one project; `GET /tasks/?project_id=...` correctly returned all three tasks.
- Confirmed a second organisation's admin received `403` attempting to change the first organisation's project status or create a task under its project, and that the second organisation's own `GET /operations/summary` correctly reported all zeros.
- Queried `operations_audit_log` directly in Postgres and confirmed `project_created`, `task_created`, and `task_completed` were all recorded against the correct project/task ids.
- Confirmed via the frontend's own BFF proxy route (`POST /api/portal/tasks`) that a task can be created through the full stack, not just the direct backend API.
- Confirmed the real frontend's `/portal/operations`, the Operations department's own dashboard, and `/portal/cto` all rendered their respective widgets' real heading text and, for `/portal/operations` and the department dashboard, the real "Office Relocation" project name.

All verification data (both test organisations, their users, the department, the project, all three tasks, and all operations audit log rows) was deleted from the real dev database afterward via direct SQL in FK-dependency order; both temporary server instances were stopped — the `next-server` child again required an explicit `kill -9` after `pkill -f "next start"` only killed the wrapper, the same known quirk from every prior package — confirmed by a follow-up `curl` against both ports returning connection-refused.

## 7. Explicitly not done

- No `Milestone` entity — `Project` + `Task` only, per the confirmed decision.
- No submit → admin-decide gate on `Project`/`Task` — ungated per the confirmed decision.
- No `Department.function = "operations"` wiring into CTO Orchestration's delegation routing — dashboard-identity signal only, same standing gap already flagged for `"sales"`/`"customer_success"`/`"marketing"`/`"finance"`, now affecting five values.
- No update or delete endpoint for `Project`/`Task` beyond status transitions — same standing "create and read/decide only" gap this project has repeatedly flagged, now on a seventh and eighth data model.
- No new tier-gated capability — nothing in this package is AI-generated or model-suggested.
