# Wave 2, Workstream 2 — Deployment & Health Readiness — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (all code changes); `teracom-ai-frontend` (governance docs only — no frontend change needed). **Source:** `WAVE2_IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §2, derived from `INTERNAL_PILOT_READINESS_ASSESSMENT.md`'s finding that both existing health endpoints require authentication and the connection pool runs on unexamined defaults. **Scope:** exactly what the plan bounded — an unauthenticated readiness endpoint and explicit pool sizing — with multi-worker deployment explicitly and deliberately excluded.

---

## 1. What was implemented

### A real, unauthenticated readiness endpoint
Confirmed by direct code reading before any change: `GET /health/` (`api/health.py`) requires `get_current_user`. A separate, pre-existing bare `GET /` route in `main.py` is genuinely unauthenticated but is a static response — it never touches the database, so it only proves the process is up, not that it's actually ready to serve real requests.

Added `GET /healthz` directly in `main.py`, at the root path (not nested under the existing `/health`-prefixed router, which would have placed it at the non-conventional `/health/healthz`). It runs a real `SELECT 1` against the database via the existing `get_db` dependency and returns `200 {"status": "ok"}` on success, or `503 {"status": "unavailable", "detail": <error>}` on failure — a real, differentiated readiness signal a standard orchestrator or uptime monitor can act on.

### Explicit connection pool sizing
`database/connection.py`'s `create_engine()` call previously passed no pool arguments at all, relying on SQLAlchemy's implicit defaults (`pool_size=5`, `max_overflow=10`) — confirmed by direct reading, not assumed. Added two new config settings, `DB_POOL_SIZE` (default 10) and `DB_MAX_OVERFLOW` (default 20), and passed them explicitly to `create_engine()`.

### What was deliberately NOT done
**Multi-worker deployment (`uvicorn --workers >1`) was not enabled.** `docs/operations/PRODUCTION_RUNBOOK.md` already documents, from Package SEC1, that the in-process rate limiter is not shared across multiple worker processes and that enabling multiple workers today would silently make login/signup/password-reset rate limiting inconsistent. This workstream's scope — the health endpoint and pool sizing — does not touch that blocker at all. The runbook's existing warning was reaffirmed with a note pointing at this workstream, not removed or worked around.

---

## 2. Tests

New file `tests/test_healthz.py`, 3 tests:
- `test_healthz_requires_no_authentication_and_reports_ok` — a real, unauthenticated call returns `200 {"status": "ok"}`.
- `test_healthz_returns_503_when_the_database_is_unreachable` — overrides the `get_db` dependency with a mock session whose `execute()` raises, confirming a real `503` with the error detail, without needing to actually take the test database down mid-suite.
- `test_root_liveness_route_is_still_real_and_unauthenticated` — a regression check confirming the pre-existing bare `/` route is unaffected; this workstream added a readiness probe alongside it, not a replacement.

---

## 3. Validation

- **Backend:** full suite — 286/286 passing (283 before this workstream, +3 new). Zero regressions.
- **Frontend:** 302/302 passing, unaffected — no frontend code changed.

---

## 4. What remains explicitly deferred

- **Multi-worker deployment** — blocked on replacing the in-process rate limiter with a distributed (e.g., Redis-backed) one. Named as a distinct, separate future item, not attempted here.
- **Connection pool sizing is a reasoned starting point, not a load-tested final value** — appropriate for a real pilot's expected concurrent load; revisit once real usage data exists, and again if multi-worker deployment is ever enabled.

---

## 5. Commit status

Backend and frontend (governance docs, including `docs/operations/PRODUCTION_RUNBOOK.md`) changes complete and tested, ready to commit locally. **Not pushed** — per instruction ("Commit locally... Do not push").
