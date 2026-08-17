# Department Head Implementation Report — Phase 0 Package I

**Scope:** Package I — Department Head Layer & Executive Organisation, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package (same situation as Packages G/H) — see the backend report's §1 for the three design forks resolved with the user before any code was written.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance and a real local Ollama instance, as both an admin and a `member` user.
**Depends on:** Packages 1–9, G, and H — session cookie/`getSessionToken()`, `AuthProvider`/`useAuth()`, `PortalNav`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, `decodeJwtPayload`, `lib/api/workers.js`'s `fetchWorkerList`, `lib/api/departments.js`'s existing functions, `lib/api/orchestration.js`'s consult-panel conventions, and Package H's `AssignWorkerDepartmentControl`/`DepartmentListView` are all reused or extended as noted below.
**Out of scope (unchanged, not implemented):** Billing & Licensing (still a UX scaffold, Package 9); no request/approval workflow for worker creation (see backend report §1); no auto-created executive structure.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/departments` | New: any-org-member department index — every department, its current head, its description |
| `/portal/departments/:departmentId` | New: the **Department Head dashboard** (objective #3) — identity, head, this department's workers, a link to Package H's memory view, and (when headed) direct communication with any other department's head |
| `/portal/admin/departments` (extended) | Gains a head-assignment dropdown per department (admin-only) |
| `/portal/cto` (extended) | `CtoOrchestrationPanel`/`CtoExecutionHistory` now note/badge which steps went to a Department Head |
| `PATCH /api/portal/departments/:departmentId/head` | BFF proxy → `PATCH /departments/{id}/head` |
| `POST /api/portal/department-heads/consult` | BFF proxy → `POST /department-heads/consult` |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package I source was read directly as it was built alongside this frontend work — `models/department.py`, `schemas/department.py`/`schemas/cto_orchestration.py`, `services/department_service.py`/`cto_orchestration_service.py`/`context_builder.py`, `api/departments.py`/`api/department_head_orchestration.py`, and `auth/organisation.py`.

Confirmed directly, driving the frontend's own design:

- **A worker must already belong to a department before being designated its head** — `PATCH /departments/{id}/head` 400s otherwise. `AssignDepartmentHeadControl`'s dropdown accordingly only ever lists workers already assigned to that department (`worker.department_id === department.id`), so an admin cannot even attempt an invalid assignment from this UI, though the backend remains the real enforcement.
- **Department-head-to-department-head consultation has no suggestion step** — `POST /department-heads/consult` takes both worker ids directly, unlike the generic `/orchestration/consult`'s suggest-then-confirm flow. `DepartmentHeadConsultationPanel` accordingly has no "check for a match" step — a picker for the other department's head plus a message field, matching the design decision that direct communication is initiated by name, not discovered.
- **A worker who exists and belongs to the caller's organisation but isn't a current department head gets a distinct 404** ("Worker is not a current department head") from "worker not found" — confirmed this doesn't come up in normal use of this UI at all, since the picker only ever offers workers who already are current heads (`department.head_worker_id` present), sourced from the same `GET /departments/` list every other page already uses.
- **`is_department_head` is additive on every CTO plan/roadmap/execution response** — confirmed the key is always present (defaulting `false`) even for executions persisted before this package, so no defensive `?? false` was needed when rendering the badge.

None of these findings required backend changes from this side.

## 3. Department Head entities, executive hierarchy, dashboards (requirements #1–#3)

- **`/portal/departments`** is the first non-admin-gated, non-memory-specific department surface — Package H's department screens are either admin-only management (`/portal/admin/departments`) or memory-only (`/portal/memory/department/:id`). Any org member can browse the structure and its current heads here, then open a department's own dashboard.
- **The Department Head dashboard** (`/portal/departments/:departmentId`) assembles: `fetchDepartment` (identity), `fetchDepartmentWorkers` (Package I, this department's own workers), `fetchDepartments` (every department, to build the "other heads" picker for direct communication), and `fetchDepartmentHeadConsultations` (filtered client-side to this department's head — the same small-dataset, filter-client-side precedent Package H already used for scope-specific views). A 403/404 on the department fetch itself collapses to "Department not found," the same convention every other detail page in this app uses.
- **`/portal/admin/departments`** (Package H, extended) gained `AssignDepartmentHeadControl` — one dropdown per department row, next to the existing `AssignWorkerDepartmentControl` per-worker row, both driven by the same `departments`/`workers` props the page already fetches.

## 4. Direct communication between Department Heads (requirement #4)

`DepartmentHeadConsultationPanel` is deliberately simpler than Package F's `OrchestrationPanel` — no "check for a colleague" step, since direct head-to-head communication names both participants up front. It only renders on the dashboard when the department has a head, and only offers other departments that also currently have a head (`otherHeads`, computed server-side in the page). Submitting calls the new BFF route, then `router.refresh()`s so the dashboard's own consultation history (fetched server-side) picks up the new row without a second client-side fetch.

## 5. Department-owned worker management (requirement #5)

The dashboard's worker list is read-only visibility, per the design decision — reassignment remains exclusively on `/portal/admin/departments` via Package H's existing `AssignWorkerDepartmentControl`. No new mutation surface was added here; this page's job is showing what a department currently owns, not managing it.

## 6. Department memory ownership and visibility (requirement #6)

This is backend logic (`services/context_builder.py#build_context()` — see the backend report §7) with no dedicated frontend surface of its own; the existing `/portal/memory/department/:id` view (Package H, unchanged) remains the place to browse a department's raw memory. The dashboard links to it rather than duplicating it.

## 7. Executive summaries returned to the Orchestrator, CTO integration (requirements #7, #8, #10)

`CtoOrchestrationPanel.js`'s plan roadmap and chain-result steps now show "— Department Head" / "(Department Head)" next to any phase/step where `is_department_head` is true; `CtoExecutionHistory.js`'s hop-chain summary line does the same ("Head of Sales (Dept. Head)"). This is the concrete surfacing of "executive summaries returned to the Orchestrator" — attribution on the existing synthesis output, not a new visualisation or a second synthesis layer, matching Package G's own restrained UI philosophy.

## 8. Governance rules (requirement #9)

No frontend gating code was added for financial commitments, contracts, or customer pricing — no such capability exists in this product at all (Package 9 remains a UX scaffold). The governance-relevant UI behaviour this package does add: `AssignDepartmentHeadControl` and department creation remain admin-only (matching Package H's existing pattern), and the department-head-to-department-head consult panel only ever appears once a real head exists — there is no path to trigger it "accidentally."

## 9. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/departments, /portal/departments/[departmentId],
                     /api/portal/departments/[departmentId]/head,
                     /api/portal/department-heads/consult), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 143, pass 143, fail 0
```

### Unit tests (143 total; 8 new for this package)

New: `lib/api/__tests__/departmentHeads.test.js`, plus 2 new cases in `lib/api/__tests__/departments.test.js` (`assignDepartmentHead`, `fetchDepartmentWorkers`) and 6 new cases in `lib/api/__tests__/validation.test.js` for the two new parsers. All 135 tests from Packages 1–9/G/H pass unchanged.

### End-to-end smoke test (real backend, real Ollama — not mocked)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres and the genuinely-running local Ollama instance. Two departments ("Sales", "Infrastructure") each with one worker were created, both workers designated as their department's head, and an admin and a `member` user were both exercised.

| Check | Result |
|---|---|
| `GET /portal/departments` (any member) | `200`; "Head: Head of Sales" rendered from real data |
| `GET /portal/departments/:salesDeptId` dashboard | `200`; head, both departments' names (own + the other as a consult target), and the consultation panel all rendered |
| `GET /portal/admin/departments` | `200`; head-assignment dropdowns for both departments present |
| BFF → `POST /api/portal/department-heads/consult` (Infra head consults Sales head) | `200`; real, distinct Ollama responses for both the consulted worker and the primary worker's synthesis |
| `GET /portal/cto` | `200`; the department-head note rendered |
| Member → BFF `POST /api/portal/departments` (create) | `403` — admin gate holds through the BFF layer, not just the backend |

All verification data was deleted from the real dev database afterward (see backend report §9 for the full cleanup); both temporary servers were stopped and confirmed down.

---

## 10. Files changed

### New files

```
lib/api/departmentHeads.js                                    consultDepartmentHeads / fetchDepartmentHeadConsultations
lib/api/__tests__/departmentHeads.test.js                       unit tests

app/api/portal/departments/[departmentId]/head/route.js          PATCH → assignDepartmentHead() BFF proxy
app/api/portal/department-heads/consult/route.js                POST → consultDepartmentHeads() BFF proxy

app/portal/(protected)/departments/page.js                       department index (Server Component)
app/portal/(protected)/departments/loading.js                    Suspense fallback
app/portal/(protected)/departments/error.js                      error boundary safety net
app/portal/(protected)/departments/[departmentId]/page.js         Department Head dashboard (Server Component)

components/portal/DepartmentDashboard.js                        dashboard presentational body (server)
components/portal/DepartmentHeadConsultationPanel.js              direct head-to-head communication (client)
components/portal/AssignDepartmentHeadControl.js                 admin-only head-assignment dropdown (client)

docs/architecture/DEPARTMENT_HEAD_LAYER_V1.md                    reference doc for [[department-head-layer]]
docs/workforce/CFO_WORKER.md                                     new catalogue entry
docs/workforce/HEAD_OF_SALES_WORKER.md                           new catalogue entry
docs/workforce/HEAD_OF_OPERATIONS_WORKER.md                      new catalogue entry
docs/workforce/HEAD_OF_CUSTOMER_SUCCESS_WORKER.md                 new catalogue entry

docs/backend/PHASE_0_PACKAGE_I_DEPARTMENT_HEAD_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/DEPARTMENT_HEAD_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/departments.js` | Added `assignDepartmentHead`, `fetchDepartmentWorkers` | Requirements #1/#3 |
| `lib/api/validation.js` | Added `parseDepartmentHeadAssignmentPayload`, `parseDepartmentHeadConsultPayload` | Requirements #1/#4 |
| `lib/api/__tests__/departments.test.js` / `validation.test.js` | New test cases for the above | Test coverage |
| `components/portal/DepartmentListView.js` | Added `AssignDepartmentHeadControl` and a "Dashboard" link per department row | Requirement #1/#3 |
| `components/portal/CtoOrchestrationPanel.js` / `CtoExecutionHistory.js` | Department Head badges on plan/roadmap/execution steps | Requirements #7/#8/#10 |
| `components/portal/PortalNav.js` | New "Departments" top-level link | First non-admin, non-memory-specific department surface — earns the nav entry Package H deliberately withheld |
| `docs/workforce/MARKETING_MANAGER_WORKER.md` | Cross-reference note: this persona fills "Head of Marketing" | Avoids a redundant sixth catalogue file (see backend report §1) |
| `docs/workforce/WORKER_CATALOGUE.md` | Table extended to 15 types, "Recommended Department Head role?" column added | Requirement #2 |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-013 | Requirement #9 |
| `app/globals.css` | +5 lines, additive only | `.department-head-consultation-panel` classes |

No file from Packages 1–9/G/H was changed in behaviour beyond the additions listed above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 11. Remaining risks / follow-ups

1. **No user↔department/user↔worker membership model exists** (carried from Package H, unchanged) — still applies to who can view what; headship itself is a Worker-level designation, not a user-level one.
2. **No memory row of any kind can ever be corrected or removed once created** (carried from Package 6/H, unchanged and uncompounded).
3. **Department is now a CTO delegation-routing signal (this package), but only via keyword overlap on the department's own name/description** — a department with a vague or generic description may not route correctly; this remains a deterministic heuristic, not a model, by design.
4. **All risks carried over from Packages 1–9/G/H remain unchanged** — see the respective prior reports.

## 12. Recommended next package

`docs/architecture/DEPARTMENT_HEAD_LAYER_V1.md` §5 and the backend report's own recommendation both point to the same standing gap: a real update/delete (or explicit archive) capability for memory, now spanning four tiers (worker, department, organisation, summary) rather than one. A second, smaller candidate: extending the department-head consultation UI with the same "recent consultations across all departments" audit view `GET /department-heads/consultations` already supports server-side, currently only surfaced per-department on each dashboard.
