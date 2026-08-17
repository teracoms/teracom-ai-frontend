# Sales & Customer Success Implementation Report — Phase 0 Package J

**Scope:** Package J — Sales & Customer Success Platform, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package (same situation as Packages G–I) — see the backend report's §1 for the four design forks resolved with the user before any code was written.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance and a real local Ollama instance, as both an admin and a `member` user.
**Depends on:** Packages 1–9, G, H, and I — session cookie/`getSessionToken()`, `AuthProvider`/`useAuth()`, `PortalNav`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, `fetchWorkerList`, Package H's `MemorySummaryPanel` (the "one shared component, not N near-duplicates" precedent this package reuses for `DealDocumentPanel`), and Package I's `DepartmentDashboard`/`DepartmentListView`/`AssignDepartmentHeadControl` (extended, not replaced).
**Out of scope (unchanged, not implemented):** Billing & Licensing (still a UX scaffold, Package 9); real external CRM sync; AI-drafted quotes/contracts.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/sales` | New: the Sales Manager workspace — prospect intake, stage-filterable contact list |
| `/portal/sales/:contactId` | New: contact detail — stage/health controls, proposal/quote/contract management, onboarding checklist once a customer |
| `/portal/customer-success` | New: the Customer Success Manager workspace — customers only, health-filterable, linking into the same contact detail page |
| `/portal/admin/departments` (extended) | Gains a `function` dropdown per department (admin-only) |
| `/portal/departments/:departmentId` (extended) | Shows a pipeline-summary widget (function="sales") or a customer-health widget (function="customer_success") |
| 10 new BFF routes | Contact intake/stage/health, proposal submit/draft/submit-drafted/decide, quote submit/decide, contract submit/decide, onboarding seed/complete, department function |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package J source was read directly as it was built alongside this frontend work — `models/{crm_contact,proposal,quote,contract,onboarding_task}.py`, `schemas/*`, `services/{crm_contact_service,proposal_service,quote_service,contract_service,onboarding_service,crm_pipeline_service}.py`, and `api/{crm_contacts,proposals,quotes,contracts,onboarding_tasks,crm_pipeline}.py`.

Confirmed directly, driving the frontend's own design:

- **Quotes and contracts are created and submitted in one step; only proposals support a separate `"draft"` state.** `DealDocumentPanel` accordingly only shows the "Draft with AI" affordance and the drafted-row "Submit" button for `kind="proposal"` — the quote/contract forms always submit directly, matching the backend's own asymmetry rather than pretending all three are identical.
- **`POST /proposals/draft` takes `worker_id` as a query parameter, not part of the JSON body** — `draftProposal()` in `lib/api/dealDocuments.js` passes it via `backendFetch`'s `searchParams` option, the same mechanism already established for other query-param-shaped backend routes.
- **A contact's `stage` only ever moves forward** (backend 400s a backward move) — `ContactDetail`'s stage `<select>` only ever offers the current stage and later ones (`STAGE_ORDER.slice(currentIndex)`), so a user cannot even attempt an invalid transition from this UI, though the backend remains the real enforcement.
- **`GET /crm/pipeline-summary` always returns fully-keyed `stage_counts`/`health_counts`** (every known value present, zero-filled) — confirmed `PipelineSummaryWidget`/`CustomerHealthWidget` never need a defensive `?? 0` when reading a specific key.
- **No department-scoping exists on `CrmContact`** — pipeline/health data is organisation-wide, not per-department. Both dashboard widgets show the same organisation-wide `pipelineSummary` object; a "sales" department and a "customer_success" department in the same org see different *views* of identical underlying data, not different data sets. This was a deliberate simplicity choice, not an oversight — most organisations have one sales team, not per-department deal segmentation.

None of these findings required backend changes from this side.

## 3. Sales Manager and Customer Success Manager workers (requirements #1–#2)

No dedicated frontend surface — these are ordinary `Worker` rows, created via the existing Workers screens (Package 3), distinguished only by their catalogue documentation (`docs/workforce/{SALES_MANAGER_WORKER,CUSTOMER_SUCCESS_MANAGER_WORKER}.md`) and by being the natural choice to assign as `department_id` members of a "sales"/"customer_success"-`function` department. `DealDocumentPanel`'s proposal-drafting worker picker (§5) is the one place this package's UI actually asks "which worker should act here" — any active worker can be selected, not just ones named "Sales Manager."

## 4. Lead management, prospect intake, customer lifecycle tracking (requirements #3, #4, #7)

`ContactIntakeForm` (prospect intake) and `ContactListView` (stage-filterable list, via `?stage=` query params on `/portal/sales`) cover requirements #3/#4. `ContactDetail`'s stage and health `<select>` controls cover #7 — health only renders once `stage === "customer"`, matching the backend's own "meaningful only once a customer" semantics for that field.

## 5. Proposal-request workflows and governance (requirement #5, governance)

`DealDocumentPanel` is the one shared component for all three approval-gated document kinds (`kind="proposal"|"quote"|"contract"`), parametrised rather than duplicated three times — the same precedent `MemorySummaryPanel` established in Package H. Approve/reject buttons only render for `useAuth().user.role === 'admin'` — a presentation-layer convenience; the real enforcement is the backend's `require_role("admin")` on every `/decide` endpoint, verified live (§8) to hold even when called directly through this frontend's own BFF routes by a `member`. Only the proposal panel shows the "Draft with AI" control and a worker picker; quotes and contracts never do, matching the backend's own human-entered-only design for those two.

## 6. Customer onboarding workflows (requirement #6)

`OnboardingChecklist` only renders on the contact detail page once `stage === "customer"`. "Seed Default Checklist" calls the backend's fixed four-item template (Welcome call, Account setup, Training session, 30-day check-in) — this frontend does not describe it as personalised or AI-generated anywhere, matching the backend's own deterministic implementation.

## 7. CRM integration points and abstraction layer (requirement #8)

No dedicated frontend surface was built for this — per the confirmed design decision, the CRM connector abstraction is cosmetic and backend-only (mirroring Package 8's Connectors precedent). Unlike Package 8, which built a "Coming Soon" connectors card on `/portal/knowledge/connectors`, this package did not add an equivalent CRM connectors page, since no objective named a customer-facing surface for it specifically and this frontend's own discipline is not to build UI surfaces a requirement doesn't actually call for.

## 8. Executive visibility of pipeline and customer health; Department Head integration (requirements #9, #10)

`PipelineSummaryWidget` and `CustomerHealthWidget` are two small, focused components, each rendering one facet of the same `fetchPipelineSummary()` response. `DepartmentDashboard.js` (Package I, extended) conditionally renders one or the other based on `department.function` — `null`-function departments (every department that predates this package) show neither, fully additive. `DepartmentFunctionControl` (admin-only) was added to `/portal/admin/departments` alongside the existing `AssignDepartmentHeadControl`, following that component's exact shape. **Verified live (§8):** a "sales"-function department's dashboard rendered the pipeline funnel; a "customer_success"-function department's dashboard rendered the customer-health breakdown.

## 9. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/sales, /portal/sales/[contactId],
                     /portal/customer-success, and 10 new /api/portal/*
                     BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 177, pass 177, fail 0
```

### Unit tests (177 total; 34 new for this package)

New: `lib/api/__tests__/{crm,dealDocuments,onboardingTasks}.test.js`, plus one new case in `lib/api/__tests__/departments.test.js` (`assignDepartmentFunction`) and 16 new cases across `lib/api/__tests__/validation.test.js` for the eight new parsers. All 143 tests from Packages 1–9/G/H/I pass unchanged.

### End-to-end smoke test (real backend, real Ollama — not mocked)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres and the genuinely-running local Ollama instance. A Sales department and a Customer Success department (each with their `function` set and one worker assigned) and a full contact lifecycle (prospect → lead → AI-drafted-and-approved proposal → approved quote → approved contract → customer → onboarding) were exercised as both an admin and a `member` user.

| Check | Result |
|---|---|
| `GET /portal/sales` | `200`; the test contact and its stage rendered from real data |
| `GET /portal/sales/:contactId` | `200`; the AI-drafted proposal's title, its `approved` status, and the seeded "Welcome call" onboarding task all rendered |
| `GET /portal/customer-success` | `200`; the now-customer contact and its `healthy` status rendered |
| `GET /portal/departments/:salesDeptId` | `200`; "Sales Pipeline" / "Stage funnel" widget rendered |
| `GET /portal/departments/:csDeptId` | `200`; "Customer Health" widget rendered |
| `GET /portal/admin/departments` | `200`; function dropdowns for both departments present |
| Member → BFF `POST /api/portal/crm/contacts` (create) | `200` — any org member may intake a prospect |
| Member → BFF `POST /api/portal/proposals` (submit) | `200` — any org member may submit |
| Member → BFF `POST /api/portal/proposals/:id/decide` | `403` — the governance gate holds through the full BFF stack, not just the direct backend API |

All verification data was deleted from the real dev database afterward (see backend report §9 for the full cleanup); both temporary servers were stopped and confirmed down.

---

## 10. Files changed

### New files

```
lib/api/crm.js                                                  contact CRUD/stage/health + fetchPipelineSummary
lib/api/dealDocuments.js                                        proposal/quote/contract submit/decide/draft (one file, not three)
lib/api/onboardingTasks.js                                      seed/list/complete
lib/api/__tests__/{crm,dealDocuments,onboardingTasks}.test.js    unit tests

app/api/portal/crm/contacts/route.js                            POST → createContact() BFF proxy
app/api/portal/crm/contacts/[contactId]/stage/route.js          PATCH → updateContactStage() BFF proxy
app/api/portal/crm/contacts/[contactId]/health/route.js         PATCH → updateContactHealth() BFF proxy
app/api/portal/proposals/route.js                               POST → submitProposal() BFF proxy
app/api/portal/proposals/draft/route.js                         POST → draftProposal() BFF proxy
app/api/portal/proposals/[proposalId]/submit/route.js           POST → submitDraftedProposal() BFF proxy
app/api/portal/proposals/[proposalId]/decide/route.js           POST → decideProposal() BFF proxy
app/api/portal/quotes/route.js                                  POST → submitQuote() BFF proxy
app/api/portal/quotes/[quoteId]/decide/route.js                 POST → decideQuote() BFF proxy
app/api/portal/contracts/route.js                               POST → submitContract() BFF proxy
app/api/portal/contracts/[contractId]/decide/route.js           POST → decideContract() BFF proxy
app/api/portal/onboarding-tasks/route.js                        POST → seedOnboardingTasks() BFF proxy
app/api/portal/onboarding-tasks/[taskId]/complete/route.js      PATCH → completeOnboardingTask() BFF proxy
app/api/portal/departments/[departmentId]/function/route.js    PATCH → assignDepartmentFunction() BFF proxy

app/portal/(protected)/sales/{page,loading,error}.js            Sales Manager workspace
app/portal/(protected)/sales/[contactId]/{page,loading,error}.js  contact detail
app/portal/(protected)/customer-success/{page,loading,error}.js  Customer Success Manager workspace

components/portal/ContactIntakeForm.js                          prospect intake (client)
components/portal/ContactListView.js                            stage-filterable contact list (server)
components/portal/ContactDetail.js                               stage/health controls (client)
components/portal/DealDocumentPanel.js                          shared proposal/quote/contract panel (client)
components/portal/OnboardingChecklist.js                        onboarding checklist (client)
components/portal/PipelineSummaryWidget.js                      sales pipeline widget (server)
components/portal/CustomerHealthWidget.js                       customer health widget (server)
components/portal/DepartmentFunctionControl.js                  admin-only function dropdown (client)

docs/workforce/SALES_MANAGER_WORKER.md                          new catalogue entry
docs/workforce/CUSTOMER_SUCCESS_MANAGER_WORKER.md               new catalogue entry

docs/backend/PHASE_0_PACKAGE_J_SALES_AND_CUSTOMER_SUCCESS_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/SALES_AND_CUSTOMER_SUCCESS_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/departments.js` | Added `assignDepartmentFunction` | Requirement #10 |
| `lib/api/validation.js` | Added 8 new parsers (contact intake/stage/health, deal document submit/draft/decide, onboarding seed, department function) | Requirements #3–#6, #10 |
| `lib/api/__tests__/departments.test.js` / `validation.test.js` | New test cases for the above | Test coverage |
| `components/portal/DepartmentDashboard.js` | Conditionally renders `PipelineSummaryWidget`/`CustomerHealthWidget` by `department.function` | Requirements #9/#10 |
| `components/portal/DepartmentListView.js` | Added `DepartmentFunctionControl` per department row | Requirement #10 |
| `components/portal/PortalNav.js` | New "Sales"/"Customer Success" top-level links | First-class workspaces, same standard Package I's "Departments" link set |
| `app/portal/(protected)/departments/[departmentId]/page.js` | Fetches `pipelineSummary`, passes it to `DepartmentDashboard` | Requirement #9 |
| `docs/workforce/WORKER_CATALOGUE.md` | Table extended to 17 types; new note distinguishing the two operational personas from their advisory-only Head-of counterparts | Requirements #1–#2 |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-014 | Governance |

No file from Packages 1–9/G/H/I was changed in behaviour beyond the `DepartmentDashboard`/`DepartmentListView`/`PortalNav`/department-page additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 11. Remaining risks / follow-ups

1. **No department-scoping exists on `CrmContact`.** A "sales" and a "customer_success" department in the same organisation see the same organisation-wide pipeline data, just presented differently — not a per-department pipeline. Deliberate simplicity, per §2.
2. **No memory row, proposal, quote, contract, or onboarding task can ever be corrected or removed once created** — the same standing limitation carried from Package 6/H, now present at every new entity this package adds, not compounded in severity.
3. **`Department.function` is not wired into CTO Orchestration's delegation routing** — it identifies a department for dashboard purposes only in this package; using it as an additional delegation-routing signal is noted as a candidate for later, not built here.
4. **All risks carried over from Packages 1–9/G/H/I remain unchanged** — see the respective prior reports.

## 12. Recommended next package

Both the backend and frontend reports converge on the same standing gap: a real update/delete (or explicit archive) capability for memory, now joined by the identical "create and read/decide only" limitation across `CrmContact`, `Proposal`, `Quote`, `Contract`, and `OnboardingTask`. A second, smaller candidate: wiring `Department.function` into CTO Orchestration's own delegation heuristic, now that both the department-identity signal (this package) and the department-routing mechanism (Package I) exist independently but don't yet talk to each other.
