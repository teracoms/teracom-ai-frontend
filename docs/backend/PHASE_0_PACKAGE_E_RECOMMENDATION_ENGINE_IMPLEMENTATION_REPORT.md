# Phase 0 Package E: Recommendation Engine V1 — Implementation Report

**Date:** 2026-08-16 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package E (Recommendation Engine V1) only, per [[recommendation-engine-mvp-v1]], [[phase-0-package-d-marketplace-implementation-report]], and the Runtime + Intelligence Cloud architecture.

---

## 1. Scope

Implements exactly the v1 design from [[recommendation-engine-mvp-v1]]: industry field support, a recommendation service, Worker Pack ranking, recommendation API endpoints, and Recommendation audit logging (backend); a Recommended Worker Packs section and recommendation UI integration (frontend). No Recommendation Engine v2, Workforce Creation Intelligence, or Orchestration Intelligence is touched.

**Backend:** 9 modified, 6 new, nothing committed. **Frontend:** 5 modified, 1 new (this report's companion design document was already created in the prior task), nothing committed.

## 2. Files created/changed

**Backend, new:** `models/recommendation_audit_log.py`, `schemas/recommendation.py`, `services/recommendation_service.py`, `api/staff_recommendations.py`, `alembic/versions/a7e868953bf2_add_organisations_industry_and_.py`, `tests/test_recommendations.py`.
**Backend, modified:** `models/organisation.py` (`industry` column), `schemas/organisation.py` and `api/organisations.py` (`PATCH /organisations/industry`), `api/marketplace.py` (`GET /marketplace/recommendations`; `GET /marketplace/packs/{slug}` extended with `source`), `schemas/marketplace.py` (`WorkerPackRecommendationResponse`/`RecommendationsResponse`), `main.py`, `alembic/env.py`, `create_tables.py`, `tests/test_migrations.py`, `MARKETPLACE.md`.

**Frontend, modified:** `lib/api/marketplace.js` (`fetchMarketplaceRecommendations`, `fetchMarketplacePackDetail` extended with `source`), `lib/api/__tests__/marketplace.test.js`, `components/portal/MarketplacePackCard.js` (`rationale` prop), `app/portal/(protected)/marketplace/page.js` (Recommended Worker Packs section), `app/portal/(protected)/marketplace/[slug]/page.js` (`?ref=recommendation` forwarding).

## 3. Industry field support

`organisations.industry` (nullable, free text — deliberately not an enum, matching `worker_packs.industry`'s own unconstrained design from Package D rather than introducing a taxonomy decision this backend hasn't ratified). Set via `PATCH /organisations/industry`, admin-gated the same way as every other organisation-level write. This was [[recommendation-engine-mvp-v1]] §1/§7's one named concrete prerequisite — everything else this package needed already existed.

## 4. Recommendation service and Worker Pack ranking

`services/recommendation_service.py#get_recommended_packs()` implements [[recommendation-engine-mvp-v1]] §4's ranking exactly: filter to listed packs (reusing Package D's `list_marketplace_packs`), score `+2` for an industry match, `+1` for featured, `-1` (floored at 0) for workforce overlap with the organisation's existing `workers`, sort by score then `display_order`. **Confirms that design document's central finding directly:** every input is already-local data, and no Intelligence Cloud call is made anywhere in this path — verified by inspection (no new outbound HTTP call exists in this service) and by the live verification in §8, which shows correct ranking behaviour with the backend's own database as the only data source.

## 5. Tier-gated personalisation, not catalogue access

Reuses `capability_allowed_for_tier(tier, "recommendation_engine")` from Package B **unchanged** — no new gating logic was written. An organisation with no active licence, or a Starter-tier one, still receives the full ranked list (ordered by featured/display_order only); `personalized: false` is returned explicitly rather than the frontend having to infer it. Verified live (§8): the exact same two packs, correctly reordered, before and after a licence was granted.

## 6. Recommendation API endpoints

`GET /marketplace/recommendations` (new) and `GET /marketplace/packs/{slug}?source=recommendation` (existing Package D endpoint, extended with one optional query parameter — not a breaking change, confirmed by the pre-existing Package D tests still passing unmodified). `GET /staff/recommendations/audit` (new, staff-only, mirrors the existing audit-log read pattern).

## 7. Recommendation audit logging

A dedicated `recommendation_audit_log` table, kept separate from `marketplace_audit_log` so ranking/view events don't mix with curation events. `recommendations_generated` logs the full ranked pack list and scores on every call — captured whether or not personalisation was active. `recommendation_pack_viewed` logs when the `source=recommendation` query parameter is present, the pack-view signal [[recommendation-engine-mvp-v1]] §7 step 4 said to start capturing now regardless of v1's own consumption of it.

## 8. Frontend: Recommended Worker Packs section and UI integration

`lib/api/marketplace.js` gained `fetchMarketplaceRecommendations` and an extended `fetchMarketplacePackDetail(token, slug, { source })`. `/portal/marketplace` now fetches packs and recommendations concurrently (`Promise.allSettled`, per-section resilience, ADR-008) and renders a "Recommended for you" (personalised) or "Recommended" (featured-only fallback) section above the full catalogue, showing each pack's rationale. `MarketplacePackCard` accepts an optional `rationale` prop — only recommended-section cards receive one, and only those cards' links carry `?ref=recommendation`, which the detail page forwards to the backend as `source`.

## 9. Validation

### Build
Backend: `python -c "import main"` succeeds. Frontend: `npm run build` succeeds (exit 0), `npm run lint` reports no warnings or errors.

### Tests
Backend: `python -m pytest tests/` — **79 passed** (8 new Recommendation tests, plus the 71 pre-existing tests from Packages 1/2/A–D). Frontend: `npm test` — **96 passed** (3 new, plus the 93 pre-existing).

### Migration verification
The same isolated-schema upgrade/downgrade/re-upgrade round trip used for every prior package. No circular-FK risk this time (a plain column add plus one new table with only forward references) — still verified by actually running the downgrade, not assumed safe by inspection. Applied cleanly to the real dev database (18 tables → 19, plus the new `industry` column; nothing existing altered).

### API verification
Backend, live: staff published a Retail pack and a Government pack; a customer set their industry to "Retail" and, **before** obtaining any active licence, received `personalized: false` with both packs scored 0. After a real Enterprise licence was issued through the actual Licensing pipeline (Package A), the same customer's recommendations flipped to `personalized: true` with the Retail pack correctly ranked first (`score: 2`, rationale "Matches your organisation's industry"). Viewing the recommended pack with `?source=recommendation` and inspecting `GET /staff/recommendations/audit` confirmed all three expected events (two `recommendations_generated` calls with the correct scores captured at each stage, one `recommendation_pack_viewed`).

Frontend, full-stack live: logged in through the real `/api/auth/login` flow with a genuine session cookie; confirmed the "Recommended for you" section renders on `/portal/marketplace` with the real Retail pack and its real rationale text; confirmed the recommended card's link carries `?ref=recommendation` while the plain catalogue card for the same pack does not; followed the recommendation link through the actual browser-equivalent navigation and confirmed a **second, genuine** `recommendation_pack_viewed` event appeared in the backend's audit log as a direct result — not a simulated call. All verification data (organisations, users, staff users, packs, listings, licences, entitlements, and every audit log table) was deleted afterward; the pre-existing real "Teracom AI" organisation was confirmed unaffected (`status: active`, `industry: null`) throughout.

## 10. Explicitly not done

- Recommendation Engine v2 (data-informed ranking) — not implemented; this package's ranking is entirely rule-based, per its own design document's explicit v1/v2 split.
- Workforce Creation Intelligence, Orchestration Intelligence — not implemented; no code in this change relates to either.
- No new Intelligence Cloud service — confirmed unnecessary by this implementation, not merely assumed.
- No git commit in either repository — all changes remain uncommitted.
