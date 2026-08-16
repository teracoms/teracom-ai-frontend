# Phase 0 Package D: Marketplace Foundation — Implementation Report

**Date:** 2026-08-16 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) — the first package in this series to touch both. · **Scope:** Package D (Marketplace Foundation) only, per [[phase-0-master-implementation-plan-v1]], [[teracom-intelligence-cloud-implementation-roadmap-v1]] §4–§5, and the Runtime + Intelligence Cloud architecture ([[model-c-revised-architecture-v1]], [[teracom-intelligence-cloud-strategy-v1]]).

---

## 1. Scope

Implements Marketplace entities, schemas, API endpoints, service layer, Worker Pack entity model, versioning, entitlement checks, and audit logging (backend); a Marketplace page foundation, Worker Pack catalogue foundation, and API integration foundation (frontend). **Recommendation Engine, Workforce Creation Intelligence, and Orchestration Intelligence were explicitly not implemented** — no code in this change relates to any of them, per this task's instruction.

**Backend changes are in `teracom-ai-backend`**, a separate git repository — 5 modified, 8 new/untracked, nothing committed. **Frontend changes are in this repository** — 1 modified, 4 new/untracked, nothing committed (this task did not ask for a commit).

## 2. Files created/changed

**Backend, new:** `models/worker_pack.py`, `models/marketplace_listing.py`, `models/marketplace_audit_log.py`, `schemas/marketplace.py`, `services/marketplace_service.py`, `api/marketplace.py`, `api/staff_marketplace.py`, `alembic/versions/0b7c47d9fa57_add_marketplace_and_worker_pack_schema.py`, `tests/test_marketplace.py`, `MARKETPLACE.md`.
**Backend, modified:** `services/entitlement_service.py` (extracted reusable `tier_at_least()`), `main.py`, `alembic/env.py`, `create_tables.py`, `tests/test_migrations.py`.

**Frontend, new:** `lib/api/marketplace.js`, `lib/api/__tests__/marketplace.test.js`, `components/portal/MarketplacePackCard.js`, `app/portal/(protected)/marketplace/{page.js,loading.js,error.js}`, `app/portal/(protected)/marketplace/[slug]/page.js`.
**Frontend, modified:** `components/portal/PortalNav.js` (added the Marketplace link).

## 3. Marketplace entities, schemas, service layer, Worker Pack entity model

Three new tables: `worker_packs` (versioned content — `slug`+`version` unique together, `persona_templates` JSONB, `status`, nullable `min_tier`, `superseded_by_id` chain), `marketplace_listings` (the discoverability association, kept distinct from content so curation metadata — featured, display order, delisting — isn't tangled with versioning), `marketplace_audit_log` (append-only, mirrors `licensing_audit_log`'s shape from Package A). `services/marketplace_service.py` owns creation, versioning, publishing, delisting, and the tier-based access check. **Explicitly disambiguated from the commercial "Worker Pack" entitlement concept** (+5/+10 worker-count add-ons, already built in this frontend's `WorkerPackWizard.js`) — a known naming overlap flagged in [[phase-0-master-implementation-plan-v1]] §4, not introduced fresh here.

## 4. Worker Pack versioning

Editing a published pack never mutates it in place. `POST /staff/marketplace/packs/{id}/versions` creates a new draft row (same `slug`, `version + 1`). Publishing that draft repoints the existing listing to it and marks the prior version `superseded` — verified end to end (§8): publishing v2 of a pack correctly returns v2's content at the same slug, with v1 marked superseded.

## 5. Worker Pack entitlement checks

`pack_accessible_for_tier(pack, tier)` reuses `services/entitlement_service.py`'s tier ordering. A small, deliberate refactor was made to enable this cleanly: `capability_allowed_for_tier`'s inline tier-comparison logic (Package B) was extracted into a standalone `tier_at_least(tier, minimum)` function, so Marketplace and Licensing/Entitlements share one ordering rather than a second copy of the three-tier list — re-verified with a dedicated test (`test_tier_at_least_reused_by_capability_gate_still_works`) confirming the refactor changed nothing about Package B's existing behaviour. Per [[teracom-intelligence-cloud-mvp-v1]] §5, packs are ungated by default (`min_tier = null`); the column exists as a lever for a future premium pack, not because any pack uses it yet.

**Enforcement is deliberately split across two endpoints, not one:** `GET /marketplace/packs` shows every listed pack including gated ones (with `accessible: false`) — browsing isn't blocked; `GET /marketplace/packs/{slug}` is the actual enforcement point, returning `403` with the required tier rather than the pack's `persona_templates` content.

## 6. Marketplace API endpoints

Customer-facing: `GET /marketplace/packs`, `GET /marketplace/packs/{slug}`. Staff-facing (reusing the existing `staff_users`/`get_current_staff` plane from Package A — no new auth surface): `POST /staff/marketplace/packs`, `POST /staff/marketplace/packs/{id}/versions`, `POST /staff/marketplace/packs/{id}/publish`, `POST /staff/marketplace/listings/{id}/delist`, `GET /staff/marketplace/audit`.

## 7. Marketplace audit logging

Every curation event (`pack_created`, `pack_new_version_created`, `pack_published`, `listing_delisted`) writes an append-only row, mirroring Package A's `licensing_audit_log` design exactly for consistency.

## 8. Frontend: Marketplace page, Worker Pack catalogue, and API integration foundations

`lib/api/marketplace.js` — server-only fetch wrappers (`fetchMarketplacePacks`, `fetchMarketplacePackDetail`), following the exact pattern of `lib/api/workers.js`. `/portal/marketplace` (list) and `/portal/marketplace/[slug]` (detail) — Server Components, following the established loading/error/empty-state convention from every prior frontend package, reusing existing `.product-grid`/`.product-card`/`.badge` classes rather than introducing new styles. The detail page is the frontend's own enforcement-awareness point: a `403` from the backend renders "this pack requires a higher licence tier," not a generic error. Added to `PortalNav.js` alongside every other shipped section.

**A finding surfaced but explicitly not in this package's scope:** `lib/licensing/referenceLicence.js`'s own header comment states "`teracom-ai-backend` has zero billing/licensing support today... no `/licensing/*` router" — **this is now stale**, since Packages A/B/C built real `/licensing/*` endpoints this session. This package does not touch the existing Billing & Licensing pages or that reference-data module — wiring them to real data is [[runtime-and-intelligence-cloud-implementation-roadmap-v1]]'s own Phase 1 recommendation, a separate, larger task. Flagged here for visibility, not addressed.

## 9. Validation

### Build
Backend: `python -c "import main"` succeeds after every change. Frontend: `npm run build` succeeds (exit 0), `/portal/marketplace` and `/portal/marketplace/[slug]` both registered as dynamic routes; `npm run lint` reports no warnings or errors.

### Tests
Backend: `python -m pytest tests/` — **71 passed** (11 new Marketplace tests, plus the 60 pre-existing tests from Packages 1/2/A/B/C — one of which needed the same one-line dynamic-table-list import addition as every prior package's migration). Frontend: `npm test` — **93 passed** (3 new `lib/api/marketplace.js` tests, plus the 90 pre-existing).

### Migration verification
The same isolated-schema upgrade/downgrade/re-upgrade round trip used for every prior package (this migration had no unnamed-constraint risk like Package C's, since `worker_packs.superseded_by_id` is a self-referential FK within a single `CREATE TABLE`, not a cross-table circular reference — confirmed by actually running the downgrade regardless, not assumed safe by inspection alone). Applied cleanly to the real dev database (15 tables → 18, nothing existing altered).

### API verification
Backend, live against a running server: staff created and published a pack → customer (with no active licence) browsed and saw it as `accessible: true` (ungated) → full detail returned 2 persona templates. A second, `min_tier: "platinum"` pack was created and published, then correctly returned `403` with a clear message to the same customer. The Marketplace audit log was confirmed to record the full `pack_created`/`pack_published` lifecycle.

Frontend, full-stack live verification (both servers running, real login via the frontend's own `/api/auth/login`, a real session cookie): confirmed `/portal/marketplace` redirects unauthenticated visitors to login; confirmed the published pack's name renders on the list page from real backend data; confirmed the detail page renders the real persona template content; confirmed a gated pack's detail page renders the "requires a higher licence tier" message end to end through the real 403 response. All verification rows (organisations, users, staff users, worker packs, listings, audit log entries) were deleted afterward; the pre-existing real "Teracom AI" organisation was confirmed unaffected throughout.

## 10. Explicitly not done

- Recommendation Engine, Workforce Creation Intelligence, Orchestration Intelligence — not implemented; no code in this change relates to any of them.
- No frontend curation UI — staff manage packs via the API directly; the frontend foundation is browse-only.
- No fix to `lib/licensing/referenceLicence.js`'s now-stale "no `/licensing/*` router exists" claim — flagged in §8, not addressed, since wiring the existing Billing UI to real data is a separate, larger task.
- No git commit in either repository — all changes remain uncommitted.
