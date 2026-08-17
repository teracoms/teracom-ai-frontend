# Phase 0 Package I: Department Head Layer & Executive Organisation — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package I only, extending Package H (Knowledge & Memory Intelligence, `1407c04` backend / `a026735` frontend) and Package G (Autonomous CTO & Organisational Intelligence, `880fbe9` backend / `a75e965` frontend).

---

## 1. Scope and the design decisions this package was built against

Like Packages G and H, this package had no pre-existing `*_MVP_V1.md` design document. Introducing "who leads a department" required three design forks, resolved with the user (via explicit questions, then a direct restatement mid-turn) before any code was written:

1. **Executive structure is manual and admin-controlled — no bootstrap/seed action.** The six named roles (CTO, CFO, Head of Sales, Head of Marketing, Head of Operations, Head of Customer Success) are a documented reference catalogue (`docs/workforce/`), not hardcoded in the data model or auto-created by any endpoint. Per the user's own stated reasoning: worker creation and organisational restructuring already require human/admin action in this codebase, and Department Heads are structural, not exempt from that — full visibility into every organisational change matters more than one-click convenience.
2. **Direct Department Head communication is a new, dedicated, auditable endpoint reusing Package F's existing two-call consult mechanism** (`services/orchestration_service.py#execute_consultation`) rather than duplicating it or silently reusing the generic `/orchestration/consult` endpoint unrestricted — so a governance reviewer can query "every department-head-to-department-head exchange" as its own category.
3. **"Department-owned worker management" is visibility plus the existing reassignment path, not a new request/approval workflow.** A Department Head's dashboard shows the workers already in their department; moving a worker between departments still goes through Package H's existing admin-only `PATCH /workers/{id}/department`. "Human approval required for new worker creation" is satisfied by the pre-existing `require_role("admin")` gate on `POST /workers/` (Package 1) — documented as such rather than rebuilt as a parallel approval workflow.

A fourth point, stated up front rather than asked as a fork: the target hierarchy's **"Orchestrator" node is the existing CTO Orchestration mechanism itself** (`services/cto_orchestration_service.py`, Package G/H) — not a new worker or entity above CTO. "Executive summaries returned to the Orchestrator" (objective #7) means attributing the existing `executive_synthesis` output to whichever steps went to a Department Head, not a second synthesis layer.

**Objective #9's four commercial governance rules:** human-triggered execution and bounded autonomous delegation were already enforced since Package G (no code change needed, confirmed and documented); direct Department Head communication is the one genuinely new rule this package enforces; financial commitments, contracts, and customer pricing decisions have no corresponding capability anywhere in this backend to gate at all (Package 9's own report: zero billing/commerce backend) — documented as not applicable, not built as a placeholder. See `docs/architecture/DEPARTMENT_HEAD_LAYER_V1.md` for the full rule-by-rule table.

**One deviation from the original file list, found during execution and worth stating plainly:** the plan called for five new worker-catalogue docs (one per non-CTO executive role). On inspecting the existing catalogue, "Head of Marketing" already has a suitable, well-developed entry — the pre-existing Marketing Manager Worker (strategy/positioning/GTM sequencing). Duplicating it under a new filename would have been redundant and confusing, so this package adds a cross-reference note to that existing doc instead of a sixth near-duplicate file, and ships four new catalogue entries (CFO, Head of Sales, Head of Operations, Head of Customer Success) rather than five.

**Backend:** 8 modified, 3 new. **Frontend:** 12 modified, 13 new. Nothing committed in either repository, per this series' convention of leaving that decision to the user.

## 2. Files created/changed (backend)

**New:** `api/department_head_orchestration.py`, `alembic/versions/725b6b9116ff_add_departments_head_worker_id.py`, `tests/test_department_heads.py`.

**Modified:** `models/department.py` (+ nullable `head_worker_id` FK to `workers.id`), `schemas/department.py` (+ `head_worker_id` on `DepartmentResponse`, new `DepartmentHeadAssignment`), `schemas/cto_orchestration.py` (+ `is_department_head` on `CtoPlanStep`/`CtoRoadmapPhase`/`CtoStepResult`), `services/department_service.py` (§4), `services/cto_orchestration_service.py` (§5), `services/context_builder.py` (§7), `api/departments.py` (§4), `api/cto_orchestration.py` (threads the triggering user's role into `execute_chain()`, unchanged from Package H otherwise), `auth/organisation.py` (+ `get_owned_department_head()`), `main.py` (one new router registration).

## 3. Department Head entities as first-class workers (objective #1)

A Department Head is not a new entity. `Department.head_worker_id` (nullable FK to `workers.id`) designates an existing `Worker` as a department's head. The worker must already belong to that department (`Worker.department_id == Department.id`) before being designated — enforced in `services/department_service.py#assign_department_head()` (raises `ValueError`, mapped to `400`), not the database, mirroring how `Worker.department_id` itself is validated at the API layer in Package H. This creates a two-way FK cycle between `departments` and `workers` (both columns nullable, so insertion order never matters) — the same shape already present between `hardware_fingerprints` and `licences`; the autogenerate cycle warning this produces is the same harmless warning that pairing already causes.

## 4. Executive department hierarchy, dashboards, and department-owned worker management (objectives #2, #3, #5)

`PATCH /departments/{department_id}/head` (admin-only) assigns or clears a head. `GET /departments/{department_id}/workers` (any org member, ownership-checked) lists the workers already scoped to a department — the data the Department Head dashboard is built on. Both are additive endpoints on the pre-existing `api/departments.py` router. No endpoint creates or seeds any of the six named executive roles — see §1's design decision and `docs/workforce/WORKER_CATALOGUE.md` for the recommended-but-manual catalogue.

## 5. Delegation paths from Department Heads to workers, CTO integration (objectives #8, #10)

`_pick_worker_for_subtask()` gains a department-routing branch: for each department with a head present among the candidate workers, the *department's own* `name`/`description` keywords (not the head's individual `role`/`purpose`) are scored against the subtask; a department-head match wins ties against an equally-good individual-worker match. With no departments, or no department with a head — true for every organisation and every test that predates this package — the function returns byte-for-byte the same worker and rationale as before; only its return arity grew (a third, `is_department_head` element). `generate_plan()` now also queries the organisation's departments and threads this through; `execute_chain()` recomputes headship at execution time (not trusted from a prior `/plan` call) so a headship change between plan and execute is reflected accurately. Verified live (§9): an objective mentioning "sales pipeline" routed correctly to a "Head of Sales" worker whose own `role`/`purpose` fields said nothing about sales — the department's own description ("Revenue, pipeline, and customer deals") is what matched.

## 6. Direct communication between Department Heads (objective #4)

New router `api/department_head_orchestration.py`: `POST /department-heads/consult` validates both `primary_worker_id`/`consulted_worker_id` are *current heads* of a department in the caller's organisation (`auth/organisation.py#get_owned_department_head()` — a distinct `404` from "worker not found" when the worker exists but isn't a head), re-checks the same `orchestration_intelligence` tier gate the generic `/orchestration/consult` already uses, then calls `execute_consultation()` completely unchanged. Persists to the same `WorkerConsultation`/`OrchestrationAuditLog` tables Package F already built — no new table. `GET /department-heads/consultations` returns the subset of consultations where both participants are (or were, at query time) a department's head — the narrower, governance-relevant slice. Verified live (§9) that the identical consultation appears in both this list and the generic `/orchestration/consultations` list — this endpoint restricts *who may call it*, not what gets recorded or where.

## 7. Department memory ownership and visibility (objective #6)

Package H's department-memory read/write governance ladder (read: any org member; write: admin-only) is unchanged. This package adds one narrow, explicitly-flagged exception to Package H's own stated "don't touch `build_context()`" scope limit: a worker who currently heads a department now sees that department's own `DepartmentMemory` rows as part of their *ordinary chat* context (`services/context_builder.py#build_context()`), gated by the same `memory_enrichment` capability every other department-memory feature requires. For every worker who is not a current head, or every organisation not entitled, output is unchanged — verified by the fact that no worker anywhere was a head before this package. **Verified live, not just by code inspection (§9):** a department head correctly answered a factual question using department memory ("Acme Corp") that an ordinary member of the same department, asked the identical question, could not — and hallucinated a different answer instead.

## 8. Governance rules (objective #9)

See `docs/architecture/DEPARTMENT_HEAD_LAYER_V1.md` §3 for the full table. Summary: human-triggered execution and bounded autonomous delegation were already enforced (Package G, no change); direct Department Head communication is newly enforced here (§6); human approval for new worker creation and organisational restructuring were already enforced (`require_role("admin")` on the relevant endpoints since Packages 1/H/I respectively) and are documented as such, not rebuilt; financial commitments, contracts, and customer pricing decisions remain not applicable — no such capability exists anywhere in this backend to gate.

## 9. Validation

### Build
`python -c "import main"` succeeds with the new router registered.

### Tests
`python -m pytest tests/` — **131 passed** (13 new Package I tests — 4 unit tests for `_pick_worker_for_subtask`'s department-routing branch, including a department-vs-individual tie and a no-departments regression guard, against real, unpersisted `Worker`/`Department` model instances with no DB session; 6 cheap gating/isolation tests covering the "must already belong to this department" invariant, admin-only head assignment, cross-org isolation, the tier gate, and the distinct "not a current department head" 404; 3 real-Ollama tests — a department-head consultation, and a CTO plan+execute pair confirming `is_department_head: true` is reported correctly). All 118 pre-existing tests (Packages 1/2/A–H) pass unmodified.

### Migration verification
Generated via `alembic revision --autogenerate`, hand-verified for the same unnamed-FK issue every prior ALTER-TABLE migration in this series has hit and fixed (`fk_departments_head_worker_id`, following `68cd6086c905`'s and `f867c65db3e5`'s precedent exactly). Isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly. Applied to the real dev database.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database and the genuinely-running local Ollama instance, on alternate ports (confirmed no other dev servers were running beforehand). Signed up a fresh customer, seeded a real staff user, approved a real Platinum licence request, created two departments ("Sales" and "Infrastructure") each with one worker, and assigned each worker as their department's head. Then, all against the live HTTP API and the real frontend:

- Ran a department-head-to-department-head consultation (real Ollama, ~12 seconds) and confirmed it appeared in both the department-heads-only list and the generic orchestration consultations list — no regression to the pre-existing generic mechanism.
- Ran a CTO plan for an objective mentioning "sales pipeline" and confirmed it routed to "Head of Sales" with a rationale explicitly citing the department match, `is_department_head: true` on the resulting step and roadmap phase; executed the plan and confirmed the flag persisted through to the stored execution and its `GET /cto/executions` listing.
- Added a department memory fact to the Sales department, then asked the Sales department's head and a separate, non-head Sales Rep worker in the *same* department the identical factual question via ordinary chat — the head answered correctly from department memory; the non-head worker hallucinated a different answer, confirming the head-specific `build_context()` gate works exactly as designed, not just in isolation.
- Confirmed the equivalent checks through the real frontend (`/portal/departments`, `/portal/departments/:id` dashboard, `/portal/admin/departments`'s new head-assignment dropdown, `/portal/cto`'s new department-head note) as both an admin and, for the department-creation admin gate specifically, a `member` (correctly `403`'d via the BFF route).

All verification data (the test organisation, its users, both departments, all four workers, all chat/consultation/execution/audit rows, the licence/licence request/entitlement, and the seeded staff user) was deleted from the real dev database afterward; both temporary server instances were stopped, confirmed by a follow-up `curl` against both ports returning connection-refused.

## 10. Explicitly not done

- No auto-created/bootstrapped executive structure — confirmed twice by the user; every department, worker, and headship assignment in this package is created by an admin, one action at a time.
- No new top-level "Orchestrator" entity distinct from the existing CTO Orchestration mechanism.
- No gating code for financial commitments, contracts, or customer pricing — no such capability exists anywhere in this backend to gate; documented as not applicable in the new ADR-013, not built as a placeholder.
- No new request/approval workflow for worker creation — the existing `require_role("admin")` gate on `POST /workers/` already satisfies this governance rule.
- No change to Package H's department-memory governance ladder (read: any org member; write: admin-only) — only `build_context()`'s *ordinary chat* visibility gains the new head-specific inclusion.
- No fifth "Head of Marketing" catalogue file — the existing Marketing Manager Worker entry fills that role (§1).
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention.
