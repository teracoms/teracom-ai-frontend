# CFO & Finance Platform Implementation Report — Phase 0 Package M

**Scope:** Package M — CFO & Finance Platform, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package — see the backend report's §1 for the design decisions resolved with the user before any code was written, including the discovery that this project's own `PROJECT_STATE.md`/`DEPARTMENT_HEAD_LAYER_V1.md` contained a stale claim about backend licensing capability, corrected in this same change.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance, as both an admin and a `member` user. No Ollama call is exercised anywhere in this package's own new code.
**Depends on:** Packages 1–9, G, H, I, J, K, and L — session cookie/`getSessionToken()`, `AuthProvider`/`useAuth()`, `PortalNav`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, `DealDocumentPanel` (extended, not replaced), `DepartmentDashboard`/`DepartmentFunctionControl` (extended, not replaced), `FederationSummaryWidget`'s dashboard-widget shape (the precedent `FinanceSummaryWidget` follows), and the pre-existing `/portal/admin/organisation` page (unchanged) and `fetchOrganisationSummary` (Package 2, unchanged).
**Out of scope (unchanged, not implemented):** Billing & Licensing UX itself (still a scaffold, Package 9); any `Subscription`/commercial-billing entity; a retrofit of `services/ollama_service.py`'s own usage capture.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/finance` | New: the Finance workspace — org-wide finance summary, department-budget submission + org-wide list, and current licensing/entitlement data |
| `/portal/departments/:departmentId` (extended) | Shows a finance summary widget and a department-scoped budget panel when `function === "finance"` |
| `/portal/cto` (extended) | Also shows the finance summary widget — objective #11's CTO dashboard visibility |
| `/portal/admin/departments` (extended) | `DepartmentFunctionControl` gains a `"finance"` option |
| DealDocumentPanel (extended) | `kind === "proposal"` rows gain an internal-cost-estimate field, distinct from the existing customer-facing `amount` |
| 3 new BFF routes | Department budget submit/decide, proposal cost-estimate update |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package M source was read directly as it was built alongside this frontend work — `models/department_budget.py`, `models/proposal.py`'s new column, `services/{department_budget_service,finance_summary_service}.py`, and `api/{department_budgets,finance_summary}.py`, plus a re-read of `services/proposal_service.py`.

Confirmed directly, driving the frontend's own design:

- **`DepartmentBudget` shares `Quote`/`Contract`'s exact create-and-submit-in-one-step shape** — no draft state. `DepartmentBudgetPanel`'s submit form accordingly has no "Draft with AI" affordance anywhere, unlike `DealDocumentPanel`'s proposal branch.
- **`PATCH /proposals/{id}/cost-estimate` has no admin gate** — any org member may set it. The new `ProposalCostEstimateField` inside `DealDocumentPanel` therefore renders unconditionally for every proposal row (not gated behind `useAuth().user.role === 'admin'` the way the Approve/Reject buttons on the same panel are).
- **`GET /department-budgets/` omits `department_id` for an organisation-wide list, or scopes to one department when given** — `fetchDepartmentBudgets(token, departmentId)` mirrors this exactly with an optional second parameter, letting `DepartmentBudgetPanel` serve both `/portal/finance` (org-wide) and a single department's own dashboard (scoped) from one component.
- **`GET /finance/summary`'s `licensing` field is `null` when no licence has ever been issued** — `LicensingSummaryCard` renders an explicit "No active licence on record" `EmptyState` in that case, never a blank or crashing section.
- **No content/video-style AI-drafting exists anywhere in this package** — confirmed by reading every new backend service; no tier-gated capability was registered, so no frontend tier-gate messaging (`"...requires a Platinum licence"`-style banners, as `CtoOrchestrationPanel`/`FederationConsultationPanel` show) was needed anywhere in this package's own new UI.
- **`Department.function` needed zero backend schema change to accept `"finance"`** — the column has been an unconstrained nullable string since Package J. `DepartmentFunctionControl`'s new `<option value="finance">` and the BFF route's error-message copy are the only changes required; confirmed live (backend report §10) that the endpoint accepted the value immediately.

None of these findings required backend changes from this side.

## 3. CFO executive role integration; Finance Manager, Cost Analyst, Licensing Analyst Workers (requirements #1–#4)

No dedicated frontend surface was built for the workers themselves — like every worker in this catalogue, they are created via the existing Workers screens (Package 3). The "integration" this package's frontend delivers is the Finance department dashboard (§8) a CFO-Worker-headed `"finance"`-function department now shows for the first time.

## 4. Department budget tracking; governance-aware spending controls (requirements #5, #12)

`DepartmentBudgetPanel` is parametrised by an optional `departmentId`: given (a single department's own dashboard), the submit form is pre-scoped and the department picker is hidden; omitted (`/portal/finance`), a department picker is shown instead — one component serving both surfaces, the same "one shared component, parametrised" precedent `DealDocumentPanel`/`MemorySummaryPanel` already established. Approve/Reject buttons only render for `useAuth().user.role === 'admin'` — a presentation-layer convenience; the real enforcement is the backend's `require_role("admin")` on `POST /department-budgets/{id}/decide`, verified live (§9) to hold even when called directly through this frontend's own BFF routes by a `member`. This admin-only decide action, and the summary's own separate `total_allocated` (approved-only) vs. `pending_count` figures, together are the concrete governance-aware spending control objective #12 asks for.

## 5. Proposal costing workflows (requirement #6)

A new `ProposalCostEstimateField` (defined inside `DealDocumentPanel.js`, alongside the component it extends) renders for every proposal row — an input plus a "Save Cost Estimate" button, distinct from and additional to the existing customer-facing `amount` display. Unlike the Approve/Reject buttons on the same panel, this control is never gated by `user.role`, matching the backend's own ungated `PATCH /proposals/{id}/cost-estimate`.

## 6. Organisation cost visibility; federation cost tracking integration; AI usage cost reporting (requirements #7, #8, #9)

`FinanceSummaryWidget` renders department-budget totals, proposal cost-estimate totals, federation cost (reusing the backend's already-computed rollup, requirement #8), and a combined `total_estimated_organisation_cost` figure (requirement #7) from a single `fetchFinanceSummary()` response — no separate federation fetch is made from this side. AI usage cost reporting (requirement #9) is the same federation-cost figure, explicitly labelled "(simulated)" in the widget's own copy, consistent with how `FederationSummaryWidget`/`FederationConsultationHistory` already label it.

## 7. Licensing and subscription tracking (requirement #10)

`LicensingSummaryCard` surfaces the organisation's real tier/hosting/status/expiry/limits from `finance.licensing`, and states plainly in its own copy that no subscription/billing record exists yet for this organisation — an honest gap, not a hidden one, consistent with the backend's own docstring discipline (see backend report §7).

## 8. Financial dashboards for CFO and CTO; Executive Organisation integration (requirements #11, #13)

`FinanceSummaryWidget` is one component reused in three places: `/portal/finance` (the org-wide workspace), a `"finance"`-function department's own dashboard (`DepartmentDashboard.js`, extended, alongside the existing sales/customer-success/marketing branches), and `/portal/cto` (extended, following the identical per-section-resilience `Promise.allSettled` pattern, ADR-008, that Packages K/L already established there). **Verified live (§9):** all three surfaces rendered the widget's own heading text from real data.

## 9. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/finance and 3 new /api/portal/*
                     BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 224, pass 224, fail 0
```

### Unit tests (224 total; 9 new for this package)

New: `lib/api/__tests__/{finance,departmentBudgets}.test.js`, plus one new case in `lib/api/__tests__/dealDocuments.test.js` (`setProposalCostEstimate`) and 5 new cases across `lib/api/__tests__/validation.test.js` for the two new parsers, and one existing `parseDepartmentFunctionPayload` test case extended to cover `"finance"`. All 215 tests from Packages 1–9/G/H/I/J/K/L pass unchanged.

### End-to-end smoke test (real backend — no Ollama needed)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres. A Finance department (`function = "finance"`), a department budget submitted by a `member` and approved by an admin, and a proposal's internal cost estimate set by a `member` were all exercised as both roles.

| Check | Result |
|---|---|
| `GET /portal/finance` | `200`; the approved budget total and "Current licence & entitlement" section both rendered from real data |
| `GET /portal/departments/:financeDeptId` | `200`; "Budgets, costs & licensing" widget rendered |
| `GET /portal/cto` | `200`; the same finance widget rendered again, alongside the existing CTO/marketing/federation widgets |
| Member → BFF `POST /api/portal/department-budgets` (submit) | `200` — any org member may submit |
| Member → BFF `POST /api/portal/department-budgets/:id/decide` | `403` — the governance gate holds through the full BFF stack, not just the direct backend API |
| Admin → BFF `POST /api/portal/department-budgets/:id/decide` | `200` |

All verification data was deleted from the real dev database afterward (see backend report §10 for the full cleanup); both temporary servers were stopped and confirmed down.

---

## 10. Files changed

### New files

```
lib/api/finance.js                                          fetchFinanceSummary
lib/api/departmentBudgets.js                                submitDepartmentBudget/decideDepartmentBudget/fetchDepartmentBudgets
lib/api/__tests__/{finance,departmentBudgets}.test.js        unit tests

app/api/portal/department-budgets/route.js                  POST → submitDepartmentBudget() BFF proxy
app/api/portal/department-budgets/[budgetId]/decide/route.js   POST → decideDepartmentBudget() BFF proxy
app/api/portal/proposals/[proposalId]/cost-estimate/route.js   PATCH → setProposalCostEstimate() BFF proxy

app/portal/(protected)/finance/{page,loading,error}.js      the Finance workspace

components/portal/DepartmentBudgetPanel.js                  submit/list/admin-decide, parametrised by optional departmentId (client)
components/portal/FinanceSummaryWidget.js                   finance summary widget (server)
components/portal/LicensingSummaryCard.js                   current licence/entitlement display (server)

docs/workforce/{FINANCE_MANAGER_WORKER,COST_ANALYST_WORKER,LICENSING_ANALYST_WORKER}.md   new catalogue entries

docs/backend/PHASE_0_PACKAGE_M_CFO_AND_FINANCE_PLATFORM_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/CFO_AND_FINANCE_PLATFORM_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/dealDocuments.js` | Added `setProposalCostEstimate` | Requirement #6 |
| `lib/api/__tests__/dealDocuments.test.js` | New test case for the above | Test coverage |
| `lib/api/validation.js` | Added `parseDepartmentBudgetPayload`/`parseProposalCostEstimatePayload`; extended `DEPARTMENT_FUNCTIONS` to include `"finance"` | Requirements #5, #6, #13 |
| `lib/api/__tests__/validation.test.js` | New test cases for the above; extended the existing `parseDepartmentFunctionPayload` test to cover `"finance"` | Test coverage |
| `components/portal/DealDocumentPanel.js` | New `ProposalCostEstimateField` sub-component, rendered for `kind === "proposal"` rows | Requirement #6 |
| `components/portal/DepartmentFunctionControl.js` | Added a `"finance"` `<option>` | Requirement #13 |
| `components/portal/DepartmentDashboard.js` | Conditionally renders `FinanceSummaryWidget` + `DepartmentBudgetPanel` when `department.function === "finance"` | Requirements #11/#13 |
| `app/portal/(protected)/departments/[departmentId]/page.js` | Fetches `financeSummary`/`departmentBudgets`, passes them to `DepartmentDashboard` | Requirement #5/#11 |
| `app/portal/(protected)/cto/page.js` | Fetches `financeSummary`, renders `FinanceSummaryWidget` in its own section | Requirement #11 |
| `app/api/portal/departments/[departmentId]/function/route.js` | Updated error-message copy to include `"finance"` | Requirement #13 |
| `docs/workforce/CFO_WORKER.md` | New note on the Package M retrofit of this role's real mechanics, without changing existing scope | Requirement #1 |
| `docs/workforce/WORKER_CATALOGUE.md` | Table extended to 21 types; new note on the three parallel personas and the Licensing Analyst disambiguation | Requirements #2–#4 |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-017 | Governance |
| `docs/governance/PROJECT_STATE.md` / `CURRENT_SPRINT.md` | Corrected the stale "zero billing/licensing backend" claim; added the Package M row/risks | Documentation discipline (backend report §9) |
| `docs/architecture/DEPARTMENT_HEAD_LAYER_V1.md` | Corrected three stale "not applicable" governance-table rows superseded by ADR-014/ADR-017 | Documentation discipline |

No file from Packages 1–9/G/H/I/J/K/L was changed in behaviour beyond the `DealDocumentPanel`/`DepartmentFunctionControl`/`DepartmentDashboard`/department-page/CTO-page additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 11. Remaining risks / follow-ups

1. **No department-scoping restriction beyond what `Proposal`/`CrmContact` already lack** — `Proposal.internal_cost_estimate` and `DepartmentBudget` are both organisation-wide concepts (a budget belongs to one department, but the org-wide `/portal/finance` view sees all of them) — consistent with this project's established simplicity trade-off, not an oversight.
2. **No department budget can ever be corrected or removed once created** — the same standing limitation carried from Package 6/H/J/K/L, now present on this package's own entity too.
3. **`Department.function = "finance"` is not wired into CTO Orchestration's delegation routing** — same standing gap already flagged for `"sales"`/`"customer_success"`/`"marketing"` in three consecutive prior reports.
4. **No subscription/commercial-billing data exists to show** — `LicensingSummaryCard` is honest about this rather than presenting a misleadingly empty or absent section.
5. **All risks carried over from Packages 1–9/G/H/I/J/K/L remain unchanged** — see the respective prior reports.

## 12. Recommended next package

All six most recent reports (Packages H, I, J, K, L, M) converge on the same standing gap: a real update/delete (or explicit archive) capability, now spanning fourteen distinct rows across memory, sales/customer-success, marketing/media, federation, and finance data models. A second, recurring candidate, now flagged in four consecutive packages' reports: wiring `Department.function` (now four values — `"sales"`, `"customer_success"`, `"marketing"`, `"finance"`) into CTO Orchestration's own delegation heuristic. A third candidate this package's own research surfaces directly: the *commercial billing* backend work `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §3 lists is now more precisely scoped than before — the licence-issuance mechanism it once assumed didn't exist is real; what remains is specifically price, invoicing, and a `Subscription` entity.
