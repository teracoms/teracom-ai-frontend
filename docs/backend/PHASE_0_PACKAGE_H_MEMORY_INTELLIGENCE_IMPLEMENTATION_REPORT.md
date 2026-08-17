# Phase 0 Package H: Knowledge & Memory Intelligence — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package H only, extending Package G (Autonomous CTO & Organisational Intelligence, `880fbe9` backend / `a75e965` frontend) and the pre-existing `WorkerMemory` (Package 6, frontend `MEMORY_IMPLEMENTATION_REPORT.md`).

---

## 1. Scope and the design decisions this package was built against

Like Package G, this package had no pre-existing `*_MVP_V1.md` design document. Its objectives (organisational/department/worker memory, memory retrieval for orchestration, governance-aware access, memory summaries/retention) required introducing a genuinely new entity — **Department** does not exist anywhere in the pre-existing schema (only Organisation → Worker). Three design forks were raised and resolved before any code was written:

1. **Departments are a real first-class entity** — a new `departments` table plus a nullable `Worker.department_id` FK, admin-managed — not a derived/virtual grouping over existing `role`/`purpose` keywords.
2. **Governance ladder**: worker memory unchanged (any org member, no role gate — Package 6's existing behaviour); department memory — any member of the owning organisation may read, only an admin may write; organisation memory — admin-only for both read and write. No user↔department/worker membership concept exists anywhere in this schema, so "department member" read access collapses to "member of the owning organisation" — stated plainly here rather than silently narrowed, the same honesty precedent every prior report in this series uses for its own gaps.
3. **Retention is purely additive** — a new `MemorySummary` table stores LLM-condensed rollups; no update or delete endpoint exists for any memory row (raw or summarised) anywhere in this package, preserving Package 6's own standing "no memory can ever be corrected or removed" limitation rather than building a bigger, riskier capability nobody asked to add here.

A fourth decision, not asked as a fork but found and closed during implementation: `services/entitlement_service.py` already registered a `"memory_enrichment"` capability (Enterprise+ minimum) in Package B, but no endpoint anywhere ever checked it — confirmed by grepping the whole backend before writing any router. Every new memory-intelligence endpoint (organisation memory, department memory, memory summaries) now gates on this pre-existing, previously-unwired capability. Departments themselves are **not** gated by it — they are an org-chart primitive, like Workers/Knowledge, not an Intelligence Cloud capability.

**Backend:** 6 modified, 15 new. **Frontend:** 7 modified, 20 new. Nothing committed in either repository, per this series' convention of leaving that decision to the user.

## 2. Files created/changed (backend)

**New:** `models/{department,organisation_memory,department_memory,memory_summary}.py`, `schemas/{department,organisation_memory,department_memory,memory_summary}.py`, `services/{department_service,organisation_memory_service,department_memory_service,memory_retrieval_service,memory_summary_generation_service,memory_governance_service}.py`, `api/{departments,organisation_memory,department_memory,memory_summaries}.py`, `alembic/versions/f867c65db3e5_add_departments_organisation_and_.py`, `tests/test_memory_intelligence.py`.

**Modified:** `models/worker.py` (nullable `department_id` FK, additive), `schemas/worker.py` (additive `department_id` field on `WorkerResponse`), `auth/organisation.py` (new `get_owned_department()`, mirroring `get_owned_worker`/`get_owned_knowledge`/`get_owned_session`), `api/workers.py` (new `PATCH /workers/{id}/department` endpoint — the one addition to this pre-existing router), `services/cto_orchestration_service.py` (§4), `api/cto_orchestration.py` (passes the triggering user's role through to `execute_chain()`), `main.py` (four new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the four new models — the same three-file update Package G made for its own two new tables).

## 3. Organisational memory architecture (objective #1)

`OrganisationMemory` (`organisation_id`, `memory_type` default `"fact"`, `memory_content`, `created_by_user_id`, `created_at`) is the broadest tier, structurally identical to `WorkerMemory` except for its scope and an added `created_by_user_id`/`created_at` (new tables get these from the start; the pre-existing `WorkerMemory` table is left untouched, per this package's additive-only mandate). `POST /organisation-memory/store` / `GET /organisation-memory/` are both admin-only (`require_role("admin")`) and gated behind `memory_enrichment` (Enterprise+).

## 4. Department-level memory (objective #2)

`Department` (`organisation_id`, `name`, `description`, `created_at`) is admin-created via `POST /departments/` — not tier-gated, since departments are an org-chart primitive. `GET /departments/`/`GET /departments/{id}` are open to any org member (ownership-checked via the new `get_owned_department()`). Workers are assigned via `PATCH /workers/{worker_id}/department` (admin-only, body `{department_id: str | null}`; both the worker and, when non-null, the department are confirmed same-organisation before any write). `DepartmentMemory` mirrors `OrganisationMemory`'s shape, scoped by `department_id`; `POST /department-memory/store` is admin-only, `GET /department-memory/{department_id}` is open to any member of the owning organisation — both gated behind `memory_enrichment`.

## 5. Worker-level memory (objective #3)

Unchanged. `WorkerMemory`, `api/memory.py`, `services/memory_service.py` are exactly as Package 6 left them — no role gate, no tier gate, create + read only. This package extends the hierarchy above it, not the tier itself.

## 6. Memory retrieval for orchestration decisions (objective #4)

`services/memory_retrieval_service.py#get_hierarchical_memory_context(organisation_id, worker_ids, include_organisation_tier, db, limit=30)` generalises Package G's own `build_organisational_memory_context()` (which aggregated worker memory only) into a three-tier lookup: worker memory for the given `worker_ids` (unchanged query), department memory for every distinct non-null department among those workers' owners, and organisation memory only when `include_organisation_tier` is `True`. Capped at 30 entries total, same bound as Package G's original. This is a standalone service, not CTO-specific — reusable by any future caller. `services/cto_orchestration_service.py`'s own `build_organisational_memory_context()` was removed in favour of calling this shared function directly (§8 confirms the full pre-existing CTO test suite still passes unmodified against this change).

## 7. Memory summaries and long-term retention (objective #6)

`MemorySummary` (`organisation_id`, `scope` — `organisation`/`department`/`worker` — `scope_id` as a plain UUID with no FK, since it is polymorphic across three different tables, `summary_content`, `source_count`, `requested_by_user_id`, `generated_at`) is created only by `services/memory_summary_generation_service.py#generate_memory_summary()`, which gathers every raw memory row for that scope (organisation scope pulls its own `OrganisationMemory` rows plus every department's `DepartmentMemory` plus every worker's `WorkerMemory` in the org; department scope pulls its own memory plus its workers'; worker scope pulls just that worker's) and makes one real Ollama call (`services/ollama_service.py#generate_response()`, the same mechanism as CTO's executive synthesis) to condense them. Raises `NoMemoryToSummariseError` (mapped to `400`) when a scope has zero raw memories rather than persisting an empty summary. `POST /memory-summaries/generate` / `GET /memory-summaries/` gate access per-scope identically to that scope's own read rule (§9), plus `memory_enrichment`. No raw memory row is ever edited or deleted by this feature.

## 8. Governance-aware memory access (objective #5)

The full ladder, all verified live (§12), not just unit-tested:

| Tier | Read | Write |
|---|---|---|
| Worker (unchanged, Package 6) | any org member | any org member |
| Department | any member of the owning organisation | admin only |
| Organisation | admin only | admin only |

`services/memory_governance_service.py#require_memory_enrichment()` is the one shared entitlement gate every new memory-intelligence endpoint applies on top of its own role/ownership check. `api/memory_summaries.py#_check_scope_access()` centralises the "a summary's access rule matches its scope's own read rule" logic explicitly, since a summary's content is derived directly from that scope's raw memory — generating an organisation-scope summary for a non-admin would otherwise leak admin-only content through the summary text, the same class of bypass §9 below is careful to avoid for CTO orchestration.

**One governance finding this design deliberately closes, not just documents:** naively feeding organisation-level memory into every CTO chain's synthesis prompt (as a straightforward extension of Package G's own aggregation) would let a non-admin `member` who triggers a chain indirectly read admin-only organisation memory through the synthesis output — a real governance bypass, not a hypothetical one. §9 describes the fix.

## 9. Integrating memory into CTO planning and delegation (objective #8)

`services/cto_orchestration_service.py#execute_chain()` now takes an additional `triggering_user_role` parameter (threaded through from `api/cto_orchestration.py`'s `current_user["role"]`) and passes `include_organisation_tier=(triggering_user_role == "admin")` to `get_hierarchical_memory_context()` when building the executive synthesis prompt. Department-tier memory is always includable (its own read gate is already "any org member"); worker-tier memory is unchanged. **Verified live, not just by code inspection (§12):** an admin-triggered chain's synthesis correctly surfaced and used an organisation-tier fact ("our head office is in Sydney") that the individual hop's own response never mentioned (it hallucinated "New York City"); the identical objective, run by a `member` instead, produced a synthesis that picked up the department-tier fact (Dell servers) but never corrected the hallucinated head-office location — a real, reproduced confirmation that the admin-only gate on organisation-tier memory holds through the whole delegation chain, not just at the direct-read endpoints.

`_pick_worker_for_subtask()` is untouched — department is not used as a delegation-routing signal in this package, only as a memory-scoping one, per this design's explicit scope limit.

## 10. Validation

### Build
`python -c "import main"` succeeds with every new router registered.

### Tests
`python -m pytest tests/` — **118 passed** (16 new Package H tests — 4 unit tests for `get_hierarchical_memory_context`'s aggregation/cap/org-tier-gating logic against a real disposable-schema DB with no Ollama calls, 8 cheap gating/isolation tests covering department CRUD admin-gating and cross-org isolation, the tier gate, and the full read/write governance ladder, plus 4 real-Ollama tests — two summary-generation cases (organisation scope as admin, department scope as a member) and one confirming a CTO chain still completes correctly with department/organisation memory present — kept small, matching `test_cto_orchestration.py`'s own "kept to a few cases since each makes real LLM calls" discipline. All 102 pre-existing tests (Packages 1/2/A–G) pass unmodified, including the full `test_cto_orchestration.py` suite re-verified after `execute_chain()`'s signature change and the removal of its private `build_organisational_memory_context()` helper.

### Migration verification
Generated via `alembic revision --autogenerate`, then hand-verified: the autogenerated FK from `workers.department_id` to `departments.id` was unnamed, which cannot later be dropped by name without a naming convention on `Base.metadata` — the identical issue `68cd6086c905_add_hardware_fingerprints_table_and_.py` (Package A) already found and fixed for `licences.hardware_fingerprint_id`; the same explicit-name fix (`fk_workers_department_id`) was applied here. The full isolated-schema upgrade → downgrade → re-upgrade round trip (`tests/conftest.py`'s own `migrated_schema` fixture technique, run standalone against a disposable `pkgh_verify_*` schema) passed cleanly. Applied to the real dev database: 23 → 27 tables (`departments`, `department_memories`, `memory_summaries`, `organisation_memories`), plus the new nullable column on `workers`.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database and the genuinely-running local Ollama instance, on alternate ports since no other dev servers were running at the time (confirmed via `ss -ltnp` beforehand). Signed up a fresh customer, seeded a real staff user, submitted and approved a real Platinum licence request, created a department and a worker, assigned the worker to the department, and created a `member` user via the real `POST /users/` + `/auth/login` flow. Then, all against the live HTTP API:

- Confirmed the full governance ladder directly: `member` blocked (`403`) from both organisation-memory write and read, and from department-memory write; `admin` succeeded at both; `member` succeeded at department-memory **read**, correctly seeing the admin-written row.
- Confirmed `member` blocked (`403`) from generating an organisation-scope summary; `admin` succeeded, producing a real, coherent Ollama-generated summary ("Head Office Location: Sydney... Server Vendor: Dell") condensing both the organisation and department memory just stored.
- Ran the CTO chain integration check described in §9 twice — once as `admin` (organisation-tier fact correctly surfaced and used to correct the hop's own hallucinated answer) and once as `member` (organisation-tier fact correctly absent from the synthesis, department-tier fact still present) — the concrete, reproduced confirmation for objective #8's governance-aware integration.
- Repeated the equivalent checks through the real frontend (`/portal/memory`, `/portal/memory/organisation`, `/portal/memory/department/{id}`, `/portal/admin/departments`, `/portal/cto`) as both users, and through the frontend's own BFF proxy routes (`/api/portal/departments`, `/api/portal/organisation-memory`, `/api/portal/memory-summaries`) — see `MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md` (frontend report) §8 for the full list.

All verification data (the test organisation, its two users, the department, the worker, all memory/summary/execution/audit rows, the licence/licence request/entitlement, and the seeded staff user) was deleted from the real dev database afterward; both temporary server instances were stopped, confirmed by a follow-up `curl` against both ports returning connection-refused.

## 11. Explicitly not done

- No user↔department or user↔worker membership model — "department member" read access reduces to "member of the owning organisation," per §1's design decision.
- No update or delete endpoint for any memory row, raw or summarised, anywhere in this package — retention means "condensed for reuse," not "pruned," per §1's design decision. `WorkerMemory`'s own pre-existing "no memory can ever be corrected or removed" gap (Package 6 §10) is unchanged and uncompounded.
- No change to `_pick_worker_for_subtask()`'s delegation heuristic — department is a memory-scoping signal only in this package, not a routing one.
- No new entitlement tier or capability name — reuses the already-registered, previously-unwired `memory_enrichment` capability exactly as Package B left it.
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention of leaving that decision to the user.
