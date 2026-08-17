# Current Sprint

**As of:** 2026-08-17
**Replace, don't accumulate:** this file reflects only what's active *right now*. When a sprint ends, move its outcome into [[changelog]] and overwrite this file for the next one — do not let this turn into a history log (that's what the changelog is for).

---

## Where things stand

Packages 1 through 9, plus Package G (Autonomous CTO & Organisational Intelligence), Package H (Knowledge & Memory Intelligence), and Package I (Department Head Layer & Executive Organisation), have all been addressed. Packages 1–8, G, H, and I are complete, real, backend-verified implementations (build/lint/test passing, end-to-end smoke-tested against a live backend and, for G/H/I, a real local Ollama instance). **Package 9 (Billing & Licensing) is different: it is a frontend UX scaffold against illustrative reference data, not a real licensing system** — `teracom-ai-backend` has zero billing/licensing support of any kind (confirmed by grepping the entire backend source; see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §2). See [[project-state]] §2 for the verified file-level evidence and `docs/frontend/IMPLEMENTATION_REPORTS/` for the full reports, plus `docs/backend/PHASE_0_PACKAGE_G_AUTONOMOUS_CTO_IMPLEMENTATION_REPORT.md`, `PHASE_0_PACKAGE_H_MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md`, and `PHASE_0_PACKAGE_I_DEPARTMENT_HEAD_IMPLEMENTATION_REPORT.md` for the three most recent.

`FRONTEND_ARCHITECTURE_V1.md` Part E's original nine-package sequencing was already exhausted before G/H/I; those three packages extended the product beyond that original roadmap (organisational intelligence, its supporting memory hierarchy, and now the Department Head layer between Organisation and Worker) rather than filling in a remaining slot from it. What remains is backend/schema work and governance follow-ups — see below.

## Active work

None assigned. The concrete next steps, in priority order:

1. **Start the backend schema/endpoint work `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §3 lists**, beginning with an organisation-level licence record (columns on `organisations` or a new `licences` table). This has been the single most urgent non-code gap in this project since Package 1 — it is now the *only* thing standing between Package 9's UX scaffold and a real licensing system. Nothing else in that backend-requirements list can proceed without this first.
2. **Resolve `LICENSING_MODEL_V1.md` §19's still-open items** that block specific Package 9 screens from ever becoming real: licence file format/signing (blocks a real Licence Details), hardware-fingerprint algorithm (blocks real Sovereign/Customer-Hosted enforcement), and who performs human approval (blocks turning the three wizards already built into a real workflow).
3. **A small, standalone hardening pass on Package 7's admin pages**, applying the same fix Package 9 (and now Package H) applied to their own new pages: `/portal/admin/users`, `/portal/admin/organisation`, and `/portal/admin/permissions` likely still execute their real backend calls for a non-admin request even though the visible page has always correctly shown only the restricted message — the same Next.js App Router layout/children rendering gap Package 9 found and fixed for its own pages (§9 of that report). Not urgent (nothing has ever been visibly wrong), but worth closing properly.
4. **A real update/delete (or explicit archive) capability for memory**, now overdue across four tiers instead of one: `WorkerMemory` (Package 6), `DepartmentMemory`, `OrganisationMemory`, and `MemorySummary` (all Package H) all share the identical "create and read only" gap. Since Package H's summaries are themselves derived from raw memory, a single backend conversation about correction/removal semantics could address all four at once rather than one at a time.
5. ~~Use department assignment as a real CTO delegation signal.~~ **Done — Package I.** `_pick_worker_for_subtask()` now routes to a department's head when the department's own name/description best matches a subtask.

## Known backend gaps carried from prior packages (not yet fixed, backend repo)

- **`DELETE /documents/{id}` throws an unhandled 500 for any document still assigned to a worker** (Package 4). See `KNOWLEDGE_IMPLEMENTATION_REPORT.md` §4/§10.
- **`POST /chat/` cannot be resumed and never returns its session's id** (Package 5). See `CHAT_IMPLEMENTATION_REPORT.md` §2. Still the highest-value backend fix identified for the existing product experience.
- **No update or delete endpoint exists for any memory tier** (Package 6, extended by Package H) — worker, department, and organisation memory, plus memory summaries, are all create/read only. See `MEMORY_IMPLEMENTATION_REPORT.md` §2/§10 and `PHASE_0_PACKAGE_H_MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md` §11.
- **No worker-update or worker-delete endpoint exists** (Package 3) — `EditWorkerForm.js` is deliberately non-persisting. See `WORKERS_IMPLEMENTATION_REPORT.md` §8.
- **`POST /permissions/` has no deduplication check and can leave a document silently un-revoked after one "Remove" click** (Package 7). See `ADMIN_IMPLEMENTATION_REPORT.md` §2/§10.
- **No user-role-change, deactivation, or delete endpoint exists** (Package 7). See `ADMIN_IMPLEMENTATION_REPORT.md` §10.
- **Connectors are entirely non-functional and not organisation-scoped even in principle** (Package 8). See `CONNECTORS_IMPLEMENTATION_REPORT.md` §2/§9.
- **Zero billing/licensing backend support of any kind exists** (Package 9) — see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §3 for the itemised, prioritised backend requirements list.
- **No user↔department or user↔worker membership model exists** (Package H) — department memory's read gate is "any member of the owning organisation," not a finer-grained per-user assignment. See `PHASE_0_PACKAGE_H_MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md` §1.
- **The CTO department-routing heuristic is a plain keyword match on a department's own name/description** (Package I) — a vaguely-described department may not route correctly to its head. Deterministic and testable by design, not a model. See `PHASE_0_PACKAGE_I_DEPARTMENT_HEAD_IMPLEMENTATION_REPORT.md` §5.

## Parallel track reminder

The backend schema conversation for billing/licensing (flagged as the standing "most urgent non-code gap" since Package 1) remains the single blocking dependency for turning Package 9 from a UX scaffold into a real product feature — unaffected by Package G/H/I, which extended the product in an unrelated direction (organisational intelligence, memory, and now the Department Head layer).
