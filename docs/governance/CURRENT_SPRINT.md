# Current Sprint

**As of:** 2026-08-15
**Replace, don't accumulate:** this file reflects only what's active *right now*. When a sprint ends, move its outcome into [[changelog]] and overwrite this file for the next one — do not let this turn into a history log (that's what the changelog is for).

---

## Where things stand

Packages 1 through 9 have all been addressed — Packages 1–8 are complete, real, backend-verified implementations (build/lint/test passing, end-to-end smoke-tested against a live backend). **Package 9 (Billing & Licensing) is different: it is a frontend UX scaffold against illustrative reference data, not a real licensing system** — `teracom-ai-backend` has zero billing/licensing support of any kind (confirmed by grepping the entire backend source; see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §2). See [[project-state]] §2 for the verified file-level evidence and `docs/frontend/IMPLEMENTATION_REPORTS/` for the full reports (`AUTHENTICATION_IMPLEMENTATION_REPORT.md`, `DASHBOARD_IMPLEMENTATION_REPORT.md`, `WORKERS_IMPLEMENTATION_REPORT.md`, `KNOWLEDGE_IMPLEMENTATION_REPORT.md`, `CHAT_IMPLEMENTATION_REPORT.md`, `MEMORY_IMPLEMENTATION_REPORT.md`, `ADMIN_IMPLEMENTATION_REPORT.md`, `CONNECTORS_IMPLEMENTATION_REPORT.md`, `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md`).

`FRONTEND_ARCHITECTURE_V1.md` Part E's original nine-package sequencing is now exhausted. What remains is not "which package" but backend/schema work and governance follow-ups — see below.

## Active work

None assigned. The concrete next steps, in priority order:

1. **Start the backend schema/endpoint work `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §3 lists**, beginning with an organisation-level licence record (columns on `organisations` or a new `licences` table). This has been the single most urgent non-code gap in this project since Package 1 — it is now the *only* thing standing between Package 9's UX scaffold and a real licensing system. Nothing else in that backend-requirements list can proceed without this first.
2. **Resolve `LICENSING_MODEL_V1.md` §19's still-open items** that block specific Package 9 screens from ever becoming real: licence file format/signing (blocks a real Licence Details), hardware-fingerprint algorithm (blocks real Sovereign/Customer-Hosted enforcement), and who performs human approval (blocks turning the three wizards already built into a real workflow).
3. **A small, standalone hardening pass on Package 7's admin pages**, applying the same fix Package 9 applied to its own new pages: `/portal/admin/users`, `/portal/admin/organisation`, and `/portal/admin/permissions` likely still execute their real backend calls for a non-admin request even though the visible page has always correctly shown only the restricted message — the same Next.js App Router layout/children rendering gap Package 9 found and fixed for its own pages (§9 of that report). Not urgent (nothing has ever been visibly wrong), but worth closing properly.

## Known backend gaps carried from prior packages (not yet fixed, backend repo)

- **`DELETE /documents/{id}` throws an unhandled 500 for any document still assigned to a worker** (Package 4). See `KNOWLEDGE_IMPLEMENTATION_REPORT.md` §4/§10.
- **`POST /chat/` cannot be resumed and never returns its session's id** (Package 5). See `CHAT_IMPLEMENTATION_REPORT.md` §2. Still the highest-value backend fix identified for the existing product experience.
- **No update or delete endpoint exists for a memory** (Package 6). See `MEMORY_IMPLEMENTATION_REPORT.md` §2/§10.
- **No worker-update or worker-delete endpoint exists** (Package 3) — `EditWorkerForm.js` is deliberately non-persisting. See `WORKERS_IMPLEMENTATION_REPORT.md` §8.
- **`POST /permissions/` has no deduplication check and can leave a document silently un-revoked after one "Remove" click** (Package 7). See `ADMIN_IMPLEMENTATION_REPORT.md` §2/§10.
- **No user-role-change, deactivation, or delete endpoint exists** (Package 7). See `ADMIN_IMPLEMENTATION_REPORT.md` §10.
- **Connectors are entirely non-functional and not organisation-scoped even in principle** (Package 8). See `CONNECTORS_IMPLEMENTATION_REPORT.md` §2/§9.
- **Zero billing/licensing backend support of any kind exists** (Package 9) — see `BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md` §3 for the itemised, prioritised backend requirements list.

## Parallel track reminder

The backend schema conversation for billing/licensing (flagged as the standing "most urgent non-code gap" since Package 1) is no longer one of several things to parallelise — with every other package shipped, it is the single blocking dependency for turning Package 9 from a UX scaffold into a real product feature.
