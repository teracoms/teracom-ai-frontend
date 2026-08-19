# Wave 1, Workstream 1 — Internal Pilot Blockers — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (all code changes); `teracom-ai-frontend` (governance docs only — no frontend code changed). **Source:** `IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §1, itself derived from `INTERNAL_PILOT_READINESS_ASSESSMENT.md`'s findings. **Scope:** exactly the two defects named in the plan — the document-delete integrity error and the cross-plane login rate-limiter bug. SMTP Completion and Password Reset Completion (the other two Day-0 internal-pilot blockers) are separate, later workstreams in this same wave and are not addressed here.

---

## 1. What was fixed

### 1a. `DELETE /documents/{id}` integrity error

**Root cause, confirmed by direct code reading before any change was made:** `services/document_management_service.py#delete_document()` called `db.delete(document); db.commit()` with no handling of dependent rows. `KnowledgePermission.knowledge_id`'s foreign key has no `ondelete` set, and `Knowledge` had no `relationship()` to `KnowledgePermission` at all — so deleting a `Knowledge` row with any existing permission assignment (the common case, since upload always creates one) raised an unhandled Postgres `IntegrityError`, surfaced to the caller as a bare 500. Separately, `services/chroma_service.py` had no delete method at all — even a successful Postgres delete would leave the document's vector embedding permanently in the Chroma collection, still returned by semantic search.

**Fix:**
- `models/knowledge.py` — added `permissions = relationship("KnowledgePermission", cascade="all, delete-orphan")`. This is an ORM-level fix: SQLAlchemy loads and deletes the dependent `KnowledgePermission` rows in the same transaction as the `Knowledge` delete. **No database migration was required** — the fix is expressed entirely at the ORM layer, not the schema layer.
- `services/chroma_service.py` — added `delete_embedding(document_id)`, calling `collection.delete(ids=[str(document_id)])`.
- `services/document_management_service.py` — `delete_document()` now calls `delete_embedding()` after the Postgres commit succeeds, wrapped in a try/except that logs a warning on failure rather than raising. This ordering is deliberate: Postgres is the source of truth for whether a document exists, so a Chroma failure must never resurrect an already-deleted document or block the caller.

### 1b. Cross-plane login rate limiter

**Root cause, confirmed by direct code reading:** `auth/rate_limit.py` defined exactly one `login_rate_limiter = LoginRateLimiter(...)` module-level singleton, imported unmodified by `api/auth.py` (User plane), `api/staff_auth.py` (StaffUser plane), and `api/portal_contact_auth.py` (PortalContact plane) — all three `/login` endpoints shared one rate-limit budget keyed only on `(ip, email)`. A burst of failed attempts against one identity plane could lock out an unrelated attempt on a different plane sharing the same email/IP pairing. This is the identical bug class ADR-024 already found and fixed for the two password-reset limiters (`password_reset_rate_limiter` vs `portal_contact_password_reset_rate_limiter`) — but that fix was never checked against the login limiters specifically.

**Fix:**
- `auth/rate_limit.py` — added two new instances, `staff_login_rate_limiter` and `portal_contact_login_rate_limiter`, same class and config as the original, with comments explaining the isolation rationale (mirroring the existing password-reset comment style exactly).
- `api/staff_auth.py` — import and all three call sites (`.check`/`.record_failure`/`.record_success`) switched to `staff_login_rate_limiter`; the docstring's stale "reuses the existing LoginRateLimiter instance" note corrected.
- `api/portal_contact_auth.py` — identical change, switched to `portal_contact_login_rate_limiter`.
- `api/auth.py` — **unchanged**. `login_rate_limiter` is now correctly the User plane's own, exclusively-used instance.

---

## 2. Tests

Four new tests, all passing:

- `tests/test_session_security.py::test_delete_document_with_existing_permission_succeeds` — creates a real worker, a real knowledge document, and a real permission grant via the actual API endpoints, deletes the document as admin, asserts a 200 (not 500) with `deleted: true`, and confirms the document is genuinely gone (a subsequent `GET` returns 404).
- `tests/test_chroma_service.py::test_delete_embedding_removes_the_document_from_the_collection` — adds a throwaway embedding with a random UUID id, calls `delete_embedding()`, and confirms `collection.get()` no longer returns it.
- `tests/test_session_security.py::test_login_rate_limiter_is_isolated_per_identity_plane` — a direct unit test against the three limiter objects (mirroring `test_portal_contact_password_reset.py`'s own `test_rate_limiter_instance_is_isolated_from_the_internal_user_one` exactly, for the identical documented reason: this is a process-wide singleton with no per-test reset). Asserts all three instances are distinct, drives `login_rate_limiter` to lockout for a probe IP/email pair, then confirms the other two limiters remain unaffected for the same pair.

A test-writing note worth recording: the first version of the Chroma test failed for an unrelated reason — this Chroma version's `validate_metadata()` rejects an empty metadata dict on `add()`, and the test initially called `add_document()` without one. This is a real, if currently unreached, footgun in `chroma_service.py#add_document()`'s `metadata or {}` default (every actual production call site always passes real metadata, so it's never hit in practice) — not fixed here, since it's outside this workstream's two named defects, but worth flagging for future awareness.

---

## 3. Validation

- **Backend:** full suite run twice — 257/257 passing (up from 253 before this workstream's 4 new tests), zero regressions. (The very first run surfaced the Chroma metadata test-authoring bug above, fixed, then re-run clean.)
- **Frontend:** 302/302 passing, unchanged — confirmed no frontend code required any change. Every frontend call site touching either affected area (`lib/api/knowledge.js#deleteDocument`, the `/portal/knowledge/:documentId` delete button, and every `/login`-calling code path) is a plain pass-through that already correctly handles whatever HTTP status the backend returns; fixing the backend's status from 500→200 and removing the cross-plane lockout required zero frontend-side logic changes.
- Migration-chain discipline confirmed not implicated: neither fix adds a new column, table, or model — `create_tables.py`/`alembic/env.py`/`tests/test_migrations.py` needed no changes, confirmed by the full suite (including `test_migrations.py`) passing unchanged.

---

## 4. What was not done (explicitly out of scope for this workstream)

- SMTP Completion and Password Reset Completion — the next two workstreams in this wave.
- The Chroma `add_document()` empty-metadata footgun noted in §2 — flagged, not fixed, since it isn't currently reachable in production and is outside this workstream's two named defects.
- The stale "Package EMAIL1 ... held uncommitted pending explicit approval" claim in `CURRENT_SPRINT.md`/`PROJECT_STATE.md` (confirmed inaccurate — both repos show EMAIL1 already committed) — noticed while editing these files for an unrelated reason, but left uncorrected here to respect this workstream's explicit scope boundary. Worth a follow-up correction.

---

## 5. Commit status

Backend changes are complete and tested; governance docs (`PROJECT_STATE.md`, `CURRENT_SPRINT.md`, `ARCHITECTURE_DECISIONS.md` ADR-028, `CHANGELOG.md`) updated in the frontend repo. Both repos are ready to commit locally. **Not pushed** — awaiting approval, per instruction ("Push after approval").
