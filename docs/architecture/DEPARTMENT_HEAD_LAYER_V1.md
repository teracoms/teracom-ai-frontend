# Department Head Layer & Executive Organisation V1

**Status:** Built (Phase 0 Package I, 2026-08-17), documented here after the fact — same situation as Package G ([[orchestration-intelligence-mvp-v1]]'s "no pre-existing MVP doc" note applies here too. Full implementation detail lives in the two implementation reports; this document is the stable reference other docs link to as `[[department-head-layer]]`.

---

## 1. What a Department Head is

Not a new entity. A **Department Head** is an existing `Worker` (`teracom-ai-backend`'s `workers` table, unchanged) referenced by a `Department`'s `head_worker_id` column (Package I). A worker must already belong to that department (`Worker.department_id == Department.id`, Package H) before being designated its head. This mirrors Package H's own "reuse Worker, add a scoping FK" pattern for department membership itself.

## 2. The target hierarchy and its six recommended roles

```
Human → Orchestrator → CTO → CFO → Head of Sales → Head of Marketing
      → Head of Operations → Head of Customer Success → Specialist Workers
```

**"Orchestrator" is the existing CTO Orchestration mechanism** (`services/cto_orchestration_service.py`, Package G/H) — not a new worker or entity. The six named executive roles are a **recommended reference catalogue**, not a hardcoded or auto-created structure — see [[worker-catalogue]] for each role's product-persona documentation ([[cto-worker]], [[cfo-worker]], [[head-of-sales-worker]], [[marketing-manager-worker]] fills "Head of Marketing", [[head-of-operations-worker]], [[head-of-customer-success-worker]]). An admin creates every department, worker, and headship assignment manually — no endpoint bootstraps any of this.

## 3. Governance model (objective #9)

| Rule | Status |
|---|---|
| Human-triggered execution | Already enforced since Package G — every CTO chain, consultation, and (now) department-head consultation requires an explicit human-originated API call. No change needed. |
| Bounded autonomous delegation | Already enforced since Package G — `MAX_HOPS_HARD_CAP` on CTO chains; department-head consultation is a fixed two-call exchange (Package F's mechanism), never a chain. |
| Direct Department Head communication | **New in Package I** — `POST /department-heads/consult`, restricted to current department heads, reusing Package F's `execute_consultation()` unchanged. |
| Human approval for new worker creation | Already enforced since Package 1 — `POST /workers/` is `require_role("admin")`-gated. Package I does not add a second, parallel approval workflow for this. |
| Human approval for organisational restructuring | Already enforced — `POST /departments/`, `PATCH /workers/{id}/department`, `PATCH /departments/{id}/head` are all admin-gated (the last two, admin-gated since Package H/I respectively). |
| Human approval for financial commitments | **Not applicable.** No such capability exists anywhere in this backend to gate — confirmed by Package 9's own report (zero billing/commerce backend). |
| Human approval for contracts | **Not applicable**, same reason. |
| Human approval for customer pricing decisions | **Not applicable**, same reason — Package 9's Billing & Licensing UX remains a scaffold over illustrative reference data, not a real pricing mechanism. |

## 4. CTO Orchestration integration (objectives #8, #10)

`_pick_worker_for_subtask()` now also scores each department's own `name`/`description` against a subtask (not the head's individual `role`/`purpose`), routing to that department's head when it scores at least as well as the best individual-worker match. With no department heads designated (every organisation before this package), behaviour is unchanged. Every plan/roadmap/execution step now carries an `is_department_head` flag, surfaced in the CTO dashboard — the concrete form "executive summaries returned to the Orchestrator" (objective #7) takes: attribution on the existing synthesis, not a second synthesis layer.

## 5. Department memory ownership (objective #6)

Package H's department-memory read/write governance ladder is unchanged. Package I adds one narrow extension: `services/context_builder.py#build_context()` now includes a worker's own department's memory in their *ordinary chat* context when that worker currently heads the department (gated by the same `memory_enrichment` capability every other department-memory feature requires). For every worker who isn't a current head, this is byte-for-byte unchanged from Package H.

See `PHASE_0_PACKAGE_I_DEPARTMENT_HEAD_IMPLEMENTATION_REPORT.md` (backend) and `DEPARTMENT_HEAD_IMPLEMENTATION_REPORT.md` (frontend) for full file-level detail, validation, and end-to-end verification.
