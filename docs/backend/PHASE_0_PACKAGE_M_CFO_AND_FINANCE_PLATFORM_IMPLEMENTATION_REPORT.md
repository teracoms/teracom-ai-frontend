# Phase 0 Package M: CFO & Finance Platform — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package M only, extending Package J's `Proposal`/`Quote`/`Contract` shape (Sales & Customer Success Platform, `5725ee4` backend / `13844ae` frontend) and reusing Package L's cost-tracking foundation (Federation Registry & External AI Consulting, `8128c9a` backend / `896a3cc` frontend).

---

## 1. Scope and the design decisions this package was built against

A research pass surfaced two consequential findings before any code was written:

1. **CFO Worker is the Head of Sales/Head of Customer Success pattern, not the Marketing Manager retrofit pattern.** Its own doc is unambiguously advisory-only — structurally identical to how Head of Sales/Head of Customer Success were documented before Package J built their operational counterparts. So Finance Manager/Cost Analyst/Licensing Analyst Worker are genuinely new operational personas, not a retrofit — but unlike Package K's sequential three-tier pipeline, finance work has no natural production handoff between budget management, cost analysis, and licensing analysis, so the confirmed design treats them as **three parallel operational personas**.
2. **`PROJECT_STATE.md`'s "zero billing/licensing backend support of any kind exists" is stale.** `Licence`/`LicenceRequest`/`Entitlement`/`HardwareFingerprint`/`LicensingAuditLog` are real, complete, migrated tables from backend Packages A–D — every package's own e2e test already grants a real licence through this mechanism. What's genuinely absent is the *commercial billing layer* — no price, invoicing, payment, or `Subscription` entity exists anywhere (`models/licence.py`'s own docstring: "Subscriptions is a later, separate package"). This is corrected in `PROJECT_STATE.md`/`CURRENT_SPRINT.md`/`DEPARTMENT_HEAD_LAYER_V1.md` as part of this package's own documentation discipline (see §9).

Four design decisions were confirmed with the user before any code was written:

3. **AI usage cost reporting is scoped to Federation's existing simulated cost data only** — reusing `services/federation_summary_service.py#get_federation_summary()`'s already-working `total_estimated_cost` aggregate unmodified. `services/ollama_service.py` is untouched.
4. **Department budget tracking is a new `DepartmentBudget` table**, not new columns on `Department` — consistent with this project's precedent that lifecycle/approval-bearing concepts get their own table while simple tags (`Department.function`) live as columns.
5. **Proposal costing is a single new nullable column on `Proposal`** (`internal_cost_estimate`) — matches the precedent `amount` itself set.
6. **Department budgets get the full submit → org-admin-decide ceremony**, mirroring `Proposal`/`Quote`/`Contract`'s existing shape — the applicable precedent per ADR-014, since this is internal to the customer's own organisation, not Teracom's separate staff-decides licensing plane.

**No new tier-gated capability was needed.** Every objective in this package is either human-entered structured data or a read-only surfacing of already-real data — nothing here is AI-generated or model-suggested, and no Ollama call exists anywhere in this package's own new code.

**Licensing Analyst Worker vs. the pre-existing Licensing & Compliance Worker (Package D):** real name-confusion risk existed — Licensing & Compliance Worker's documented scope is about this project's own Sovereign-edition licensing *mechanism* design and regulatory compliance, explicitly declining commercial pricing. Licensing Analyst Worker is an operational persona analysing the *customer organisation's own* real licence/entitlement data. Both the new worker doc and `WORKER_CATALOGUE.md` state this distinction explicitly.

**Governance mapping, decided during planning, not asked as a fork:** "no automated spending / purchasing / contract signing" is satisfied the same way ADR-013/014/016 already established — no code path anywhere in this backend lets any worker's output execute a spending, purchasing, or signing action. "Human approval required for all financial commitments" is `DepartmentBudget`'s new submit → admin-decide gate plus `Quote`/`Contract`'s pre-existing gate (Package J, unchanged). "Human approval required for all pricing decisions" remains `Quote`/`Contract`'s existing gate, entirely unchanged; `Proposal.internal_cost_estimate` is explicitly not a pricing decision and carries no gate of its own.

**Backend:** 8 modified, 8 new. **Frontend:** 9 modified, 11 new. Nothing committed in either repository, per this series' convention.

## 2. Files created/changed (backend)

**New models:** `models/{department_budget,finance_audit_log}.py`. **New schemas:** `schemas/{department_budget,finance_audit_log,finance_summary}.py`. **New services:** `services/{department_budget_service,finance_summary_service}.py`. **New API routers:** `api/{department_budgets,finance_summary}.py`. **New migration:** `alembic/versions/57c3e717878d_...py`. **New tests:** `tests/test_finance.py`.

**Modified:** `models/proposal.py` (+ nullable `internal_cost_estimate` column), `schemas/proposal.py` (+ `internal_cost_estimate` field, new `ProposalCostEstimateUpdate`), `services/proposal_service.py` (+ `set_internal_cost_estimate()`), `api/proposals.py` (+ `PATCH /proposals/{id}/cost-estimate`), `main.py` (two new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the two new models).

## 3. CFO executive role integration; Finance Manager, Cost Analyst, Licensing Analyst Workers (objectives #1–#4)

CFO Worker's own scope is unchanged (§1) — the "integration" is that its department-head holder can now reference real data via a `"finance"`-function department's dashboard for the first time. Three new worker-catalogue entries (`docs/workforce/{FINANCE_MANAGER_WORKER,COST_ANALYST_WORKER,LICENSING_ANALYST_WORKER}.md`) are the operational personas driving the new `DepartmentBudget`/`Proposal.internal_cost_estimate`/licensing-surfacing mechanics — plain `Worker` rows like every catalogue persona, the distinction is documentation and product-persona, not a schema field.

## 4. Department budget tracking; governance-aware spending controls (objectives #5, #12)

`DepartmentBudget.status` (`submitted`|`approved`|`rejected`) mirrors `Quote`/`Contract`'s create-and-submit-in-one-step shape exactly — `services/department_budget_service.py#decide_budget()` is the admin-only human-approval gate, the concrete deliverable behind "human approval required for all financial commitments" and "governance-aware spending controls": a budget is never "approved" spending authority until an explicit admin action, and `services/finance_summary_service.py` separately reports `total_allocated` (approved only) versus `pending_count` (submitted, not yet decided) so there is no ambiguity about what is actually authorised. Every transition writes a `FinanceAuditLog` row, verified live (§8) to record the complete transition history.

## 5. Proposal costing workflows (objective #6)

`Proposal.internal_cost_estimate` (nullable `Numeric(12,2)`) is a single new column, additive-only, with zero change to `Proposal`'s existing `amount` field or lifecycle. `services/proposal_service.py#set_internal_cost_estimate()` has no status restriction and no admin gate — `PATCH /proposals/{id}/cost-estimate` is open to any org member, since an internal cost estimate is analysis, not a commercial commitment or pricing decision. Logs `proposal_cost_estimated` to `FinanceAuditLog`.

## 6. Organisation cost visibility; federation cost tracking integration; AI usage cost reporting (objectives #7, #8, #9)

`services/finance_summary_service.py#get_finance_summary()` calls `federation_summary_service.get_federation_summary()` directly and reuses its `total_estimated_cost` field unmodified — no change to Package L's own models or service. `total_estimated_organisation_cost` (objective #7's rollup) is federation cost plus the sum of every proposal's `internal_cost_estimate`. AI usage cost reporting (objective #9) is this same federation-only figure, per the confirmed decision; `services/ollama_service.py` remains untouched.

## 7. Licensing and subscription tracking (objective #10)

`services/finance_summary_service.py#_get_licensing_summary()` queries the organisation's most recently issued `Licence` and its `Entitlement` — real data, not a stub — returning tier, hosting model, status, expiry, and worker/user/organisation limits, or `None` if no licence has ever been issued. No `Subscription` entity or commercial-billing data is represented, since none exists anywhere in this backend; this is stated honestly in the schema's own docstring and in `PROJECT_STATE.md`'s correction (§9), not silently omitted.

## 8. Financial dashboards for CFO and CTO; Executive Organisation integration (objectives #11, #13)

`GET /finance/summary` (any org member, read-open like `crm_pipeline`/`marketing_summary`/`federation_summary`) is the one endpoint backing every dashboard surface the frontend report describes. `Department.function` accepts `"finance"` as a fourth convention value with zero backend schema change — the column has been an unconstrained nullable string since Package J.

## 9. Documentation correction (part of this package's own research)

`PROJECT_STATE.md`, `CURRENT_SPRINT.md`, and `docs/architecture/DEPARTMENT_HEAD_LAYER_V1.md` each contained a claim — accurate when written, stale by the time this package's research read them — that no billing/licensing backend capability exists, or that human approval for financial commitments/contracts/pricing was "not applicable" for lack of any such capability. All three are corrected in this same change: the licence-issuance/entitlement/tier-gating mechanism (backend Packages A–D) is real; `Proposal`/`Quote`/`Contract` (Package J) and now `DepartmentBudget` (this package) already enforce the governance rules those files claimed had nothing to gate. See ADR-017.

## 10. Validation

### Build
`python -c "import main"` succeeds; every new endpoint confirmed present via the app's own routes (79 total routes after registration).

### Tests
`python -m pytest tests/` — **165 passed** (4 new Package M tests — admin-only `DepartmentBudget` decide gating; any-org-member `PATCH /proposals/{id}/cost-estimate` with no gate; cross-org isolation on department budgets and the finance summary; one full integration test — no Ollama call needed, nothing in this package's own code touches it — submitting and approving a budget, setting a proposal's cost estimate, confirming `GET /finance/summary`'s full rollup including real granted-licence data, and confirming `finance_audit_log` recorded all three event types). All 161 pre-existing tests (Packages 1/2/A–L) pass unmodified.

### Migration verification
Generated via `alembic revision --autogenerate` (`down_revision = '17aa7e1b195b'`, Package L's head); no hand-fix needed for an unnamed FK constraint — `proposals.internal_cost_estimate` has no FK, and every new table's FKs are inline `CREATE TABLE` constraints. `tests/test_migrations.py`'s isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly. Applied to the real dev database.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database. Signed up a fresh customer, seeded a real staff user, approved a real Enterprise licence, created a Finance department and set its `function` to `"finance"` (confirmed: no schema change needed). Then, all against the live HTTP API and the real frontend:

- Submitted a department budget as a `member` (`$75,000`, "Q3 2026"), confirmed the same `member` is `403`'d attempting to decide it, then approved it as admin.
- Created a proposal (customer-facing `amount: $20,000`) and set its internal cost estimate (`$8,500.75`) as a `member` — confirmed no gate blocked it and `amount` was unaffected.
- Confirmed `GET /finance/summary` correctly reported `total_allocated: $75,000` (approved only), one proposal cost estimate totalling `$8,500.75`, zero federation cost (none consulted), the real granted Enterprise licence's tier/status/expiry/limits, and `total_estimated_organisation_cost: $8,500.75`.
- Confirmed `finance_audit_log` recorded `department_budget_submitted`, `department_budget_decided`, and `proposal_cost_estimated`.
- Confirmed via the frontend's own BFF proxy routes that a `member` can submit a department budget but is `403`'d attempting to decide it — the governance gate holds through the full stack, not just the direct backend API.
- Confirmed the real frontend's `/portal/finance`, the Finance department's own dashboard, and `/portal/cto` all rendered the finance summary widget's own heading text from real data.

All verification data (the test organisation, its two users, the department, the budget, the contact, the proposal, all finance audit log rows, the licence/licence request/entitlement, and the seeded staff user) was deleted from the real dev database afterward; both temporary server instances were stopped — the `next-server` child again required an explicit `kill -9` after `pkill -f "next start"` only killed the wrapper, the same known quirk from prior packages — confirmed by a follow-up `curl` against both ports returning connection-refused.

## 11. Explicitly not done

- No `Subscription` entity, invoicing, or payment processing — licensing tracking surfaces real `Licence`/`Entitlement` data; subscription/commercial-billing tracking remains genuinely unbuilt.
- No retrofit of `services/ollama_service.py`'s discarded token/usage fields — AI usage cost reporting stays scoped to Federation's existing simulated cost data.
- No new tier-gated capability — nothing in this package is AI-generated or model-suggested.
- No line-item cost breakdown on proposals — `internal_cost_estimate` is a single flat figure, matching `amount`'s own precedent.
- No update or delete endpoint for `DepartmentBudget` — same standing "create and read/decide only" gap this project has repeatedly flagged, now on a sixth data model.
- No `Department.function = "finance"` wiring into CTO Orchestration's delegation routing — dashboard-identity signal only, same standing gap already flagged for `"sales"`/`"customer_success"`/`"marketing"`.
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention.
