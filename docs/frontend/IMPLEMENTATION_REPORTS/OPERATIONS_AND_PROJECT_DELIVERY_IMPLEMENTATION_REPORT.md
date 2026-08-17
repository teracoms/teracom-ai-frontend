# Operations & Project Delivery Platform Implementation Report — Phase 0 Package N

**Scope:** Package N — Operations & Project Delivery Platform, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package — see the backend report's §1 for the design decisions resolved with the user before any code was written, including the decision to close two advisory-only-persona gaps at once with two different, already-established patterns.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance, as both an admin and a `member` user. No Ollama call is exercised anywhere in this package's own new code.
**Depends on:** Packages 1–9, G, H, I, J, K, L, and M — session cookie/`getSessionToken()`, `AuthProvider`/`useAuth()`, `PortalNav`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, `DepartmentDashboard`/`DepartmentFunctionControl` (extended, not replaced), `DepartmentBudgetPanel`'s optional-`departmentId` parametrisation shape (the precedent `ProjectPanel` follows), and `FinanceSummaryWidget`'s dashboard-widget shape (the precedent `OperationsSummaryWidget` follows).
**Out of scope (unchanged, not implemented):** a `Milestone` entity; any approval gate on `Project`/`Task`; `Department.function` wiring into CTO Orchestration's delegation routing.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/operations` | New: the Operations & Project Delivery workspace — org-wide operations summary, project creation/list (optional department picker), and per-project task management |
| `/portal/departments/:departmentId` (extended) | Shows an operations summary widget and a department-scoped project panel when `function === "operations"` |
| `/portal/cto` (extended) | Also shows the operations summary widget — organisation-wide project delivery visibility on the executive dashboard |
| `/portal/admin/departments` (extended) | `DepartmentFunctionControl` gains an `"operations"` option |
| 4 new BFF routes | Project create/status-update, task create/status-update |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package N source was read directly as it was built alongside this frontend work — `models/{project,task,operations_audit_log}.py`, `services/{project_service,task_service,operations_summary_service}.py`, and `api/{projects,tasks,operations_summary}.py`.

Confirmed directly, driving the frontend's own design:

- **`POST /projects/` and `POST /tasks/` have no admin gate, and neither does either status-update route** — any org member may create or progress either. `ProjectPanel`/`TaskPanel` accordingly have no role check anywhere, unlike `DepartmentBudgetPanel`'s admin-only decide buttons on the same-shaped panel.
- **`GET /projects/` omits `department_id` for an organisation-wide list, or scopes to one department when given; `GET /tasks/` mirrors this with an optional `project_id`** — `fetchProjects(token, departmentId)`/`fetchTasks(token, projectId)` mirror this exactly, letting `ProjectPanel` serve both `/portal/operations` (org-wide) and a single department's own dashboard (scoped) from one component.
- **`Project.department_id` is nullable** — the create form's department picker includes an explicit "No department (organisation-wide)" option rather than forcing a selection, matching the backend's own optionality.
- **No AI-drafting exists anywhere in this package** — confirmed by reading every new backend service; no tier-gated capability was registered, so no frontend tier-gate messaging was needed anywhere in this package's own new UI.
- **`Department.function` needed zero backend schema change to accept `"operations"`** — the column has been an unconstrained nullable string since Package J. `DepartmentFunctionControl`'s new `<option value="operations">` is the only change required; confirmed live (backend report §6) that the endpoint accepted the value immediately.
- **Task lists needed no separate per-project network round trip** — since `GET /tasks/` (unfiltered) returns every task in the caller's organisation, `ProjectPanel`/`TaskPanel` filter a single fetched `tasks` array by `project_id` client-side rather than fetching per expanded project, avoiding both a second BFF route and a waterfall of client-triggered fetches.

None of these findings required backend changes from this side.

## 3. Head of Operations Worker / Operations Manager Worker; Project Manager Worker retrofit (requirement: the two-track split)

No dedicated frontend surface was built for the workers themselves — like every worker in this catalogue, they are created via the existing Workers screens (Package 3). The "integration" this package's frontend delivers is the Operations department dashboard (§5) a Head-of-Operations-headed `"operations"`-function department now shows for the first time, and the real project/task mechanics Project Manager Worker's holder now operates through via `/portal/operations`.

## 4. Project/task data model; ungated creation and status changes

`ProjectPanel` (client) handles project creation and status changes; `TaskPanel` (client, rendered inside an expanded project row) handles task creation and status changes. Both post directly to their BFF routes with no role check — `useAuth()` is not even imported in either component, unlike `DepartmentBudgetPanel`'s admin-only decide buttons.

## 5. Organisation-wide and department-scoped visibility

`OperationsSummaryWidget` (server) renders project counts by status, task counts by status, and the overdue-task count — reused unchanged on `/portal/operations`, the Operations department dashboard, and `/portal/cto`, the same integration depth Package K/L/M already established there for marketing/federation/finance summaries. `DepartmentDashboard`'s new `department.function === 'operations'` branch renders both `OperationsSummaryWidget` and a department-scoped `ProjectPanel`, mirroring the `'finance'` branch's own two-widget shape from Package M.

## 6. Escalation boundary / governance surfacing

No approval-gate UI exists anywhere in this package, by design — there is no equivalent of `DepartmentBudgetPanel`'s Approve/Reject buttons anywhere in `ProjectPanel`/`TaskPanel`, since the backend itself carries no such gate for this data model (§2/§4). This is a deliberate absence, not an oversight — the same "ungated, no fake governance UI" posture Package M took for its own ungated `ProposalCostEstimateField`.

## 7. Documentation

`docs/workforce/OPERATIONS_MANAGER_WORKER.md` (new) documents the operational doer persona; `docs/workforce/PROJECT_MANAGER_WORKER.md` and `docs/workforce/HEAD_OF_OPERATIONS_WORKER.md` each gained an additive retrofit note (mirroring Package K's Marketing Manager note and Package M's CFO Worker note respectively); `docs/workforce/WORKER_CATALOGUE.md`'s table was extended to 22 types with a note explaining the two-pattern split. `docs/governance/ARCHITECTURE_DECISIONS.md` gained ADR-018. `docs/governance/PROJECT_STATE.md`/`CURRENT_SPRINT.md` gained the Package N row and two new standing-risk items.

## 8. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/operations and 4 new /api/portal/*
                     BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 231, pass 231, fail 0
```

### Unit tests (231 total; 7 new lib/api tests + 8 new validation cases for this package)

New: `lib/api/__tests__/{projects,tasks,operations}.test.js`, plus 8 new cases across `lib/api/__tests__/validation.test.js` for the four new parsers, and one existing `parseDepartmentFunctionPayload` test case extended to cover `"operations"`. All 224 tests from Packages 1–9/G/H/I/J/K/L/M pass unchanged.

### End-to-end smoke test (real backend — no Ollama needed)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres. An Operations department (`function = "operations"`), a project created by a `member`, and three tasks (one deliberately overdue) progressed by the same `member` were all exercised.

| Check | Result |
|---|---|
| `GET /portal/operations` | `200`; the created project name and correct summary counts both rendered from real data |
| `GET /portal/departments/:opsDeptId` | `200`; "Project & task delivery" panel and the operations summary widget both rendered |
| `GET /portal/cto` | `200`; the same operations widget rendered again, alongside the existing CTO/marketing/federation/finance widgets |
| Member → BFF `POST /api/portal/tasks` | `200` — any org member may create a task, no gate anywhere in the BFF stack |
| Direct API: member changes project/task status through every value | `200` at every step — no `403` anywhere, confirming the ungated design holds through the full stack |
| Direct API: a second organisation's admin against the first organisation's project/task | `403` on both a status change and a task-creation attempt |

All verification data was deleted from the real dev database afterward (see backend report §6 for the full cleanup); both temporary servers were stopped and confirmed down.

---

## 9. Files changed

### New files

```
lib/api/projects.js                                         createProject/updateProjectStatus/fetchProjects
lib/api/tasks.js                                             createTask/updateTaskStatus/fetchTasks
lib/api/operations.js                                        fetchOperationsSummary
lib/api/__tests__/{projects,tasks,operations}.test.js        unit tests

app/api/portal/projects/route.js                             POST → createProject() BFF proxy
app/api/portal/projects/[projectId]/status/route.js          PATCH → updateProjectStatus() BFF proxy
app/api/portal/tasks/route.js                                POST → createTask() BFF proxy
app/api/portal/tasks/[taskId]/status/route.js                PATCH → updateTaskStatus() BFF proxy

app/portal/(protected)/operations/{page,loading,error}.js    the Operations & Project Delivery workspace

components/portal/OperationsSummaryWidget.js                 operations summary widget (server)
components/portal/ProjectPanel.js                             create/list/status, parametrised by optional departmentId (client)
components/portal/TaskPanel.js                                per-project task create/list/status (client)

docs/workforce/OPERATIONS_MANAGER_WORKER.md                  new catalogue entry

docs/backend/PHASE_0_PACKAGE_N_OPERATIONS_AND_PROJECT_DELIVERY_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/OPERATIONS_AND_PROJECT_DELIVERY_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/validation.js` | Added `parseProjectPayload`/`parseProjectStatusPayload`/`parseTaskPayload`/`parseTaskStatusPayload`; extended `DEPARTMENT_FUNCTIONS` to include `"operations"` | Project/task creation and status changes; department function |
| `lib/api/__tests__/validation.test.js` | New test cases for the above; extended the existing `parseDepartmentFunctionPayload` test to cover `"operations"` | Test coverage |
| `components/portal/DepartmentFunctionControl.js` | Added an `"operations"` `<option>` | Department function |
| `components/portal/DepartmentDashboard.js` | Conditionally renders `OperationsSummaryWidget` + `ProjectPanel` when `department.function === "operations"` | Department dashboard integration |
| `app/portal/(protected)/departments/[departmentId]/page.js` | Fetches `operationsSummary`/`departmentProjects`/org-wide tasks (filtered by this department's project ids), passes them to `DepartmentDashboard` | Department dashboard integration |
| `app/portal/(protected)/cto/page.js` | Fetches `operationsSummary`, renders `OperationsSummaryWidget` in its own section | Executive dashboard visibility |
| `components/portal/PortalNav.js` | Added a `/portal/operations` nav link | Navigation |
| `docs/workforce/PROJECT_MANAGER_WORKER.md` | New note on the Package N retrofit of this role's real mechanics, without changing its contributor-role scope | Two-track split |
| `docs/workforce/HEAD_OF_OPERATIONS_WORKER.md` | New note on the Package N retrofit of this role's real data-reference capability, without changing its own advisory-only scope | Two-track split |
| `docs/workforce/WORKER_CATALOGUE.md` | Table extended to 22 types; new note on the two-track split and the new Operations Manager Worker row | Worker catalogue |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-018 | Governance |
| `docs/governance/PROJECT_STATE.md` / `CURRENT_SPRINT.md` | Added the Package N row/risks; extended the standing update/delete-gap and `Department.function`-routing-gap counts | Documentation discipline |

No file from Packages 1–9/G/H/I/J/K/L/M was changed in behaviour beyond the `DepartmentFunctionControl`/`DepartmentDashboard`/department-page/CTO-page/`PortalNav` additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 10. Remaining risks / follow-ups

1. **No update or delete endpoint exists for any project or task beyond status transitions** — the same standing limitation carried from Package 6/H/J/K/L/M, now present on this package's own entities too.
2. **`Department.function = "operations"` is not wired into CTO Orchestration's delegation routing** — same standing gap already flagged for `"sales"`/`"customer_success"`/`"marketing"`/`"finance"` in four consecutive prior reports, now affecting five values.
3. **No `Milestone` entity** — `Project`/`Task` is a flat two-level hierarchy; a dated-checkpoint concept within a project would need a new table if ever required.
4. **`Project`'s department-scoping is optional, not required** — a deliberate design choice (§2 of the backend report) rather than an oversight, but the org-wide `/portal/operations` view will show every project regardless of department, same trade-off `DepartmentBudgetPanel`'s org-wide view already makes.
5. **All risks carried over from Packages 1–9/G/H/I/J/K/L/M remain unchanged** — see the respective prior reports.

## 11. Recommended next package

All seven most recent reports (Packages H, I, J, K, L, M, N) converge on the same standing gap: a real update/delete (or explicit archive) capability, now spanning sixteen distinct rows across memory, sales/customer-success, marketing/media, federation, finance, and operations data models. A second, recurring candidate, now flagged in five consecutive packages' reports: wiring `Department.function` (now five values — `"sales"`, `"customer_success"`, `"marketing"`, `"finance"`, `"operations"`) into CTO Orchestration's own delegation heuristic. A third candidate remains the *commercial billing* backend work (price, invoicing, a `Subscription` entity) `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §3 lists, unaffected by this package.
