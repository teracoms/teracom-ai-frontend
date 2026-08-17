# Worker Lifecycle & Governance + Architecture Integration + Production Operations Implementation Report — Phase 0 Package PQR

**Scope:** Package PQR, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package — see the backend report's §1 for the design decisions resolved with the user before any code was written, including the explicit confirmation that `WorkerCreationRequest` extends ADR-013 rather than reversing it, and that the governance policy registry deliberately does not retrofit the 24 pre-existing `require_role("admin")` call sites.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance, as both an admin and a `member`, including one real `POST /cto/plan` call proving the `Department.function` routing fix live against genuine department/worker data (this check does not involve Ollama — `generate_plan()` is deterministic decomposition/routing; Ollama is only invoked inside `execute_chain()`, which this fix did not need to exercise).
**Depends on:** Packages 1–9, G, H, I, J, K, L, M, N, and O — the BFF-proxy pattern, `settle`/`errorMessage`, `DepartmentBudgetPanel`'s submit→admin-decide shape (the precedent `WorkerCreationRequestPanel` follows), `MediaCentreView`'s two-step-gate shape (the precedent `DeploymentRecordPanel` follows), `ProjectPanel`/`TaskPanel`'s ungated shape (the precedent `PlatformIncidentPanel` follows), and the `/portal/cto` `Promise.allSettled` + one-widget-per-package convention.
**Out of scope (unchanged, not implemented):** any retrofit of existing admin-gated routes onto the new policy registry; new role granularity; a real metrics/alerting pipeline; a cross-tenant production-operations plane.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/workers/requests` | New: worker creation request workspace, sibling to the existing `/portal/workers/new` |
| `/portal/admin/governance` | New: the policy-visibility screen (objective #7) |
| `/portal/platform-health` | New: the Production Operations workspace — health summary, deployment governance, incident tracking |
| `/portal/cto` (extended) | Also shows the platform health summary widget |
| `/portal/workers` (extended) | Gains a "Propose a Worker" link alongside the existing "Create Worker" admin action |
| 7 new BFF routes | Worker creation request submit/decide, worker status update, deployment submit/decide/complete, incident create/status |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package PQR source was read directly as it was built alongside this frontend work — `models/{worker_creation_request,deployment_record,platform_incident}.py`, `services/governance_policy_service.py`, `services/cto_orchestration_service.py`'s modified `_pick_worker_for_subtask()`, and every new router.

Confirmed directly, driving the frontend's own design:

- **`POST /workers/{id}/status` and deployment/incident routes all use the same request/response shapes as their nearest precedent** — `WorkerCreationRequestPanel` mirrors `DepartmentBudgetPanel`'s submit-form-plus-admin-decide-buttons layout exactly; `DeploymentRecordPanel` mirrors `MediaCentreView`'s two-visible-states-per-record UI (submitted → decide buttons; approved → a single "Mark Completed" button) rather than inventing a new interaction shape.
- **`GET /platform-health/summary`'s `open_incidents_by_severity` is always fully keyed** (all four severities present, zero-filled) — confirmed by reading `production_platform_health_service.py` directly — so `PlatformHealthSummaryWidget` never has to guess at a missing key, the same discipline every other summary widget in this project already relies on.
- **The governance policy registry's `GET /governance-policies/` is genuinely read-only and any-org-member** — `GovernancePolicyTable` needed no role branching at all, unlike `PortalAccountPanel`/`WorkerCreationRequestPanel`'s own admin-only action buttons.
- **No table/list precedent exists anywhere in this portal** — confirmed by grep before building `GovernancePolicyTable`; every existing list view uses the `<ul className="activity-list">` convention, not an HTML `<table>`. Built accordingly rather than introducing a new, unstyled pattern.

None of these findings required backend changes from this side.

## 3. Worker lifecycle & creation requests (objectives #1-#3)

`WorkerCreationRequestPanel` (client) — submit form plus admin-only approve/reject buttons, identical interaction shape to `DepartmentBudgetPanel`. Placed at `/portal/workers/requests`, linked from the existing Workers list page via a new "Propose a Worker" button visible to every member (unlike "Create Worker," which stays admin-only).

## 4. Governance policy visibility (objectives #4-#7, #9)

`GovernancePolicyTable` (server) — a plain read-only list, reusing the `activity-list` convention. Lives under `/portal/admin/governance`, gated by the same belt-and-braces role check every other `/portal/admin/*` page in this project uses (checking the decoded JWT's role directly, not just trusting the parent layout — the Next.js App Router rendering gap first found and fixed in Package 9).

## 5. `Department.function` → CTO routing (objective #8)

No frontend change was needed for the routing fix itself — it is entirely a backend scoring change. This package's frontend work here is limited to verifying it live (§7).

## 6. Production Operations Platform (objectives #10-#14)

`DeploymentRecordPanel` and `PlatformIncidentPanel` (both client) live together on the new `/portal/platform-health` workspace page alongside `PlatformHealthSummaryWidget` (server). The workspace follows Package N's `/portal/operations` org-wide-workspace shape exactly — one page, `Promise.allSettled` fan-out, per-section resilience (ADR-008).

## 7. Executive visibility (objective #15)

`/portal/cto` gained one more `Promise.allSettled` slot and one more section rendering `PlatformHealthSummaryWidget` — the exact established pattern (Marketing/Federation/Finance/Operations already there).

## 8. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/workers/requests, /portal/admin/governance,
                     /portal/platform-health, and 7 new /api/portal/*
                     BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 279, pass 279, fail 0
```

### Unit tests (279 total; 21 new for this package)

New: `lib/api/__tests__/{workerCreationRequests,governancePolicies,deploymentRecords,platformIncidents,platformHealth}.test.js`, one new case in `lib/api/__tests__/workers.test.js` (`updateWorkerStatus`), and 13 new cases across `lib/api/__tests__/validation.test.js` for the five new parsers. All 258 tests from Packages 1–9/G/H/I/J/K/L/M/N/O pass unchanged.

### End-to-end smoke test (real backend — no Ollama call needed anywhere in this package's own verification)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres.

| Check | Result |
|---|---|
| Member submits a worker creation request via `/portal/workers/requests` | `200`; admin sees it pending, approves it, a real Worker now appears on `/portal/workers` |
| Admin creates a `function="sales"` department with a deliberately generic name, runs a real `POST /cto/plan` call with a sales-flavoured subtask | Routes correctly to that department's head — the routing fix verified live, not just at the unit level |
| Member → BFF `POST /api/portal/deployment-records/:id/complete` before decide | `400` — the two-step gate holds through the full BFF stack |
| Member reports a critical platform incident via `/portal/platform-health` | `200`; the health widget immediately shows `status: outage` on next load, reverts to `operational` once resolved |
| Any member → `GET /portal/admin/governance` (non-admin) | Restricted message, per the existing admin-layout convention |

All verification data was deleted from the real dev database afterward (see backend report §8 for the full cleanup); both temporary servers were stopped and confirmed down.

---

## 9. Files changed

### New files

```
lib/api/{workerCreationRequests,governancePolicies,deploymentRecords,platformIncidents,platformHealth}.js
lib/api/__tests__/{workerCreationRequests,governancePolicies,deploymentRecords,platformIncidents,platformHealth}.test.js

app/api/portal/worker-creation-requests/route.js                     POST → submitWorkerCreationRequest() BFF proxy
app/api/portal/worker-creation-requests/[requestId]/decide/route.js  POST → decideWorkerCreationRequest() BFF proxy
app/api/portal/workers/[workerId]/status/route.js                    PATCH → updateWorkerStatus() BFF proxy
app/api/portal/deployment-records/route.js                           POST → submitDeploymentRecord() BFF proxy
app/api/portal/deployment-records/[recordId]/decide/route.js         POST → decideDeploymentRecord() BFF proxy
app/api/portal/deployment-records/[recordId]/complete/route.js       POST → completeDeploymentRecord() BFF proxy
app/api/portal/platform-incidents/route.js                           POST → createPlatformIncident() BFF proxy
app/api/portal/platform-incidents/[incidentId]/status/route.js       PATCH → updatePlatformIncidentStatus() BFF proxy

app/portal/(protected)/workers/requests/page.js                      worker creation request workspace
app/portal/(protected)/admin/governance/page.js                      policy visibility screen
app/portal/(protected)/platform-health/{page,loading,error}.js       Production Operations workspace

components/portal/WorkerCreationRequestPanel.js
components/portal/GovernancePolicyTable.js
components/portal/DeploymentRecordPanel.js
components/portal/PlatformIncidentPanel.js
components/portal/PlatformHealthSummaryWidget.js

docs/backend/PHASE_0_PACKAGE_PQR_WORKER_GOVERNANCE_ARCHITECTURE_AND_PRODUCTION_OPERATIONS_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/WORKER_GOVERNANCE_ARCHITECTURE_AND_PRODUCTION_OPERATIONS_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/workers.js` | Added `updateWorkerStatus` | Objective #1 |
| `lib/api/__tests__/workers.test.js` | New test case for the above | Test coverage |
| `lib/api/validation.js` | Added parsers for worker-creation-request create/decide, worker-status-update, deployment create/decide/complete, incident create/status | New BFF routes |
| `lib/api/__tests__/validation.test.js` | New test cases for the above | Test coverage |
| `components/portal/WorkerListView.js` | Added a "Propose a Worker" link, visible to every member | Objectives #1-#3 |
| `components/portal/PortalNav.js` | Added a `/portal/platform-health` link | Navigation |
| `app/portal/(protected)/cto/page.js` | Fetches `platformHealthSummary`, renders `PlatformHealthSummaryWidget` in its own section | Objective #15 |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-020 | Governance |
| `docs/architecture/DEPARTMENT_HEAD_LAYER_V1.md` | §3 gains a note on `WorkerCreationRequest` extending (not superseding) the existing worker-creation approval row; §4 gains a note on the `Department.function` keyword-boost mechanism | Documentation discipline |
| `docs/governance/PROJECT_STATE.md` / `CURRENT_SPRINT.md` | Added the Package PQR row/risks; struck through the resolved `Department.function`-routing active-work item; extended the standing update/delete-gap count | Documentation discipline |

No file from Packages 1–9/G/H/I/J/K/L/M/N/O was changed in behaviour beyond the `WorkerListView`/`PortalNav`/CTO-page additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 10. Remaining risks / follow-ups

1. **No update or delete endpoint exists for any worker creation request, deployment record, or platform incident beyond status/decide transitions** — the same standing limitation carried from Package 6/H/J/K/L/M/N/O, now present on this package's own entities too.
2. **The governance policy registry does not retrofit the 24 pre-existing `require_role("admin")` call sites** — a deliberate, stated scope boundary (ADR-020), flagged as a candidate for a dedicated, low-risk cleanup pass later.
3. **Platform health is a computed snapshot, not a real metrics/alerting/paging pipeline** — no such infrastructure exists anywhere in this backend.
4. **All risks carried over from Packages 1–9/G/H/I/J/K/L/M/N/O remain unchanged** — see the respective prior reports.

## 11. Recommended next package

All nine most recent reports (Packages H, I, J, K, L, M, N, O, PQR) converge on the same standing gap: a real update/delete (or explicit archive) capability, now spanning twenty-one distinct rows. A second, now-closed candidate (Package PQR resolved the `Department.function`-routing wiring flagged since Package J). A third, new candidate this package's own research surfaces directly: a dedicated cleanup pass retrofitting the 24 pre-existing `require_role("admin")` call sites onto the governance policy registry, now that the registry has proven itself on this package's own new endpoints — lower-risk once done as its own isolated, mechanical change rather than bundled into a larger package. A fourth remaining candidate: a self-service password-reset mechanism for `PortalContact` accounts (Package O), still blocked on the same "no email-sending capability anywhere in this backend" constraint.
