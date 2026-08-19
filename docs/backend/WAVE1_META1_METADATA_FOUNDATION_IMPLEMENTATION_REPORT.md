# Wave 1, Workstream 4 — META1 (Metadata Foundation) — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (all code changes); `teracom-ai-frontend` (governance docs only — no frontend UI, per the source plan's own scope). **Source:** `IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §4, derived from `KNOW1_ASSESSMENT.md` §6. **Scope:** the deliberately narrow v1 boundary specified in the plan — `document_type`, `sensitivity_level`, and topic tags — nothing more.

---

## 1. What this is, and why it's sequenced here

Unlike Workstreams 1–3 (all bug fixes), META1 is the first genuinely new capability in this wave: a shared classification layer for `Knowledge` documents, built *before* any of its three intended consumers exist — the Organisation Knowledge Graph, Document Lifecycle Governance, and Organisational Search. Per `KNOW1_ASSESSMENT.md` §6, this ordering is deliberate: if those three packages each invent their own classification scheme independently, reconciling them later is materially more expensive than agreeing on one shared model now, while nothing yet depends on it.

---

## 2. What was implemented

### Schema
- `models/knowledge.py` — two new nullable columns: `document_type` (`String(50)`), `sensitivity_level` (`String(50)`), plus a `tags` relationship (`cascade="all, delete-orphan"`) to a new `KnowledgeTag` model.
- `models/knowledge_tag.py` (new) — a real join table (`knowledge_tags`: `id`, `knowledge_id` FK, `tag`), with a real index on `tag` (`ix_knowledge_tags_tag`) — chosen over a JSONB array column specifically because `KNOW1_ASSESSMENT.md` names "all documents tagged X" as a real future Knowledge Graph query, which a JSONB column cannot serve with a real index.
- Migration `7a2c9e4f1b8d` (revises `4d8a2f61c7b3`) — adds the two columns and the new table. Verified via the existing `test_migrations.py` suite (upgrade/downgrade both clean) and applied to the real dev database.
- All three model-registration sync points updated (`create_tables.py`, `alembic/env.py`, `tests/test_migrations.py`), per this project's own established discipline for keeping them in sync.

### Service layer
- `services/metadata_service.py` (new) — the one place `Knowledge.document_type`/`sensitivity_level`/`KnowledgeTag` should be read or written. `DOCUMENT_TYPES` (5 values: `policy`/`pricing_reference`/`case_study`/`template`/`general`) and `SENSITIVITY_LEVELS` (3 values: `public`/`internal`/`confidential`) are the hard v1 boundary — real validation happens here, raising `InvalidMetadataError`, rather than only at the Pydantic schema layer, since future callers (the Knowledge Graph, Document Lifecycle Governance, Organisational Search) are backend services, not necessarily API requests. `set_knowledge_metadata(..., tags=[...])` replaces the full tag set when provided, rather than exposing a separate add/remove API.

### API surface
- `schemas/knowledge.py` — `KnowledgeCreate` gained three optional fields (`document_type`, `sensitivity_level`, `tags`); `KnowledgeResponse` gained `document_type`/`sensitivity_level`; new `KnowledgeMetadataUpdate`/`KnowledgeMetadataResponse` schemas.
- `api/knowledge.py` — `POST /knowledge/` now optionally sets metadata at creation time (via `metadata_service`, translating `InvalidMetadataError` into a 400); new `GET /knowledge/{id}/metadata` (any authenticated org member, matching the existing list-endpoint openness) and `PATCH /knowledge/{id}/metadata` (admin-only, matching every other Knowledge write in this router). Both new endpoints enforce cross-organisation isolation via the existing `get_owned_knowledge()` check.

### What was deliberately not added
- No `department_id` field or department-scoping dimension — confirmed `Knowledge` has no existing department relationship (direct or otherwise usable), and the source plan only asked to reuse one if it already existed. Adding a new one would be scope creep against this package's own stated boundary.
- No frontend UI — classification remains admin/API-only in this v1; a UI is deferred until a real consumer (Knowledge Graph, Document Lifecycle Governance, or Organisational Search) exists to justify one.

---

## 3. Tests

New file `tests/test_metadata_foundation.py`, 11 tests:
- Service-layer: set/get round trip, tag replace-not-append semantics, rejection of an invalid `document_type`/`sensitivity_level` with nothing written, `get_knowledge_metadata` returning `None` for a nonexistent document, and a guard asserting the allowed-value sets themselves haven't silently changed.
- API-layer: `POST /knowledge/` with optional metadata; a document created without metadata defaults to fully unclassified; an invalid `document_type` at creation time returns 400; `PATCH /knowledge/{id}/metadata` requires admin (403 for a member, 200 for an admin); cross-organisation isolation on both new endpoints (403 for a different org's admin); an invalid `sensitivity_level` on `PATCH` returns 400.

---

## 4. Validation

- **Backend:** full suite — 271/271 passing (260 before this workstream, +11 new). Zero regressions.
- **Frontend:** 302/302 passing, unaffected — no frontend code changed, consistent with this being a backend-only foundation package.
- Migration verified twice: once via `tests/test_migrations.py`'s isolated-schema upgrade/downgrade test, and once applied directly to this environment's real dev database (`alembic upgrade head`, confirmed clean).

---

## 5. Commit status

Backend and frontend (governance docs) changes complete and tested, ready to commit locally. **Not pushed** — per instruction ("Commit locally only... Hold for review when both are complete"), pushing awaits review of this workstream together with Workstream 5.
