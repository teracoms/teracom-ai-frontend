# Platform Review Wave 1: Teracom UX, Branding and Navigation Refresh — Implementation Report

**Date:** 2026-08-19 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** the first review wave after the architecture build-out (Packages A–Q) — usability, branding, navigation, hierarchy and visual presentation. Frontend-focused per direct instruction; backend changes made only where a frontend feature genuinely had no real data to render (trial signup, password reset, system metrics).

---

## 1. Scope note: what "Security OS branding" actually meant

Before touching anything, every "Security OS"/"SecurityOS" occurrence in the frontend was inventoried. Of 26 files matching, all but one were **`SecurityOS AI`** — a real, currently-marketed, distinct product on the marketing site (`app/securityos-ai/page.js`, its own Store SKUs in `lib/products.js`, its own sitemap entry, described as "The AI operating system for electronic security professionals" for Tecom Challenger/Gallagher/Genetec/Milestone/Integriti/HID integrators). That surface is explicitly protected by ADR-001 ("off-limits for redesign") and was **not touched** — renaming or removing a real product line was never the intent, and doing so without confirming that first would have been a serious, hard-to-reverse mistake.

The one genuine hit was inside the portal itself: the login page's tagline read *"Access SecurityOS AI workers, knowledge and conversations for your organisation"* — a leftover naming confusion on the one product this whole Package A–Q series actually builds (Teracom AI). Fixed to *"Access your Teracom AI Workforce — workers, knowledge and conversations for your organisation."*

## 2. CTO Orchestration → Orchestration

Every user-visible occurrence renamed (`app/portal/(protected)/cto/page.js`'s eyebrows/h1/empty-state copy/metadata title, `components/portal/CtoOrchestrationPanel.js`'s Platinum-gate message, `app/portal/(protected)/memory/page.js`'s cross-reference). The route (`/portal/cto`), component/file names, and every `lib/api/ctoOrchestration.js` function name are unchanged — this was a display-string rename only, so no link, bookmark, or backend contract was touched. Comments referencing the **CTO worker persona** (the AI Chief Technology Officer role, a distinct domain concept — see `docs/workforce/CTO_WORKER.md`) were deliberately left alone; only the *Orchestration feature's* own name changed.

## 3. Grouped navigation redesign

`components/portal/PortalNav.js` was rewritten from a flat 19-link pill row into two top-level links (Dashboard, Onboarding) plus four dropdown groups (Workforce, Business, Marketing, Platform), matching the requested structure with two adaptations:

- **Marketing's third requested sub-item, "Production", has no page of its own** — content/video drafting happens inside a campaign's own detail view (`/portal/marketing/[campaignId]`), not a separate route. Rather than add a dead link, the group lists only Campaigns and Media Centre.
- **Workforce/Platform were extended beyond the four/three items shown in the brief** to preserve every pre-existing link: Workforce also carries Knowledge, Chat, and Marketplace (no distinct home for these was suggested, and dropping them would have broken existing functionality); Platform also carries Support, and — admin-only, mirroring the pre-existing conditional `ADMIN_LINK` precedent — Governance and Administration.
- **`/portal` (the original Package 2 "Overview" launcher page) is no longer linked from the nav.** Its own job — a menu of links to everything else — is now redundant with the nav itself. The route and page are completely untouched and still directly reachable; nothing was deleted. A "Teracom AI" brand link was added to the nav bar, pointing at `/portal/dashboard`, as the new home anchor (no such brand/logo element existed in the portal chrome before this).

Built with plain React state (click-to-open dropdowns, click-outside/Escape-to-close, closes on route change) and CSS — no new npm dependency. A mobile breakpoint (`<980px`) collapses the whole nav behind a "Menu" toggle, flattening the dropdowns into a stacked list rather than nesting accordions.

## 4. Portal login experience

`app/portal/(public)/login/page.js` gained: a "Forgot password?" link, three action cards (Start Trial → new `/portal/start-trial`; Request Demo / Contact Sales → the marketing site's existing, real lead-capture form at `/#contact`, reused rather than duplicated — `app/page.js`'s `POST /api/leads` form was left completely unchanged, per ADR-001), and an `AiConciergePlaceholder` component: a disabled input with a "Coming soon" badge, honestly presentational only — no backend integration exists for it, the same discipline this codebase already applies to every not-yet-built surface (e.g. Package 8's connector cards).

## 5. Password reset workflow foundation

No email-sending capability exists anywhere in this backend (a standing gap flagged since Package O). Rather than fake a working "check your email" flow, the **real mechanism** was built and the delivery gap stated explicitly:

- **Backend:** `PasswordResetToken` model (`token_hash` — SHA-256 of a `secrets.token_urlsafe(32)` token, never the raw token — `expires_at`, single-use `used_at`), `services/password_reset_service.py` (`request_password_reset()`/`confirm_password_reset()`), and two new `api/auth.py` routes: `POST /auth/forgot-password` (always the same generic response, whether or not the email matches a real account — no enumeration signal), `POST /auth/reset-password` (token + new password → validates unexpired/unused, updates `password_hash`, marks the token used). A new IP-keyed rate limiter (`password_reset_rate_limiter`, same shape as `SignupRateLimiter`) guards the request endpoint.
- **Frontend:** `/portal/forgot-password` and `/portal/reset-password?token=...` pages, each a real form against the endpoints above.
- **What's missing, stated plainly:** delivering the raw token to the account holder (email). Until that exists, the frontend's confirmation message says so and points to an admin as the fallback — the same "admin shares out of band" convention `models/portal_contact.py` already established for initial account passwords.

## 6. Trial experience foundation

`Organisation.trial_ends_at` (nullable timestamp) and a new `POST /signup/trial` endpoint (`api/signup.py`), sharing the pre-existing `/signup`'s chicken-and-egg organisation+admin-user creation logic (refactored into a shared `_provision_organisation_and_admin()` helper) but setting `status="trial"` and `trial_ends_at = now + TRIAL_DURATION_DAYS` (default 14, env-overridable) instead of `"pending_licence"`.

**Deliberately a foundation, not enforcement:** no licence or entitlement is auto-issued — that would bypass `LICENSING_MODEL_V1.md` §9's human-approval principle, which this endpoint has no authority to waive. Nothing anywhere in this backend reads `trial_ends_at` to block or downgrade access once it passes; a trial organisation behaves exactly like any other `POST /workers/`-unenforced organisation today (see Package Q's own worker-limit-enforcement scope note). The frontend's `/portal/start-trial` self-service signup page and a trial banner on the dashboard (sourced from the real `trial_ends_at` now exposed on `OrganisationResponse`) are the visible surface; deciding what happens when a trial actually lapses is later work.

## 7. Dashboard presentation and visual refresh

Addressed together — objectives 6 and 8 overlap almost entirely (cards, icons, status). `components/portal/icons.js` adds a small, self-authored set of inline SVG glyphs (Workers/Knowledge/Memory/Chat/Orchestration/Organisation/Clock/CPU) — deliberately not a new icon-library dependency (none existed before); every glyph uses `currentColor` so it inherits whichever token its container sets. `StatTile.js` gained an optional `icon` prop (additive — every pre-existing caller with no icon renders unchanged), wired into the dashboard's four stat tiles. `OrganisationSummaryCard.js` now shows a real status badge and, for a trial organisation, the trial-countdown banner from §6. `SystemMetricsPanel.js` (§8 below) and the new login-page action cards use the same card/badge language. No new colours were introduced anywhere — status badges reuse the existing red accent for "attention" states and a neutral white/grey treatment for "fine" states, rather than adding a new hue (e.g. green) the existing palette doesn't have.

## 8. Platform health: real system resource metrics (admin-only)

The pre-existing `/portal/platform-health` page (Package PQR's per-organisation incident/deployment governance workspace) gained a new, **admin-only** "System resources" section — real host CPU/memory/disk figures and service-reachability checks, distinct from that page's existing organisation-scoped content.

**Backend:** `services/system_resource_metrics_service.py` (new dependency: `psutil`, installed and now also captured for the first time in a `pip freeze`-derived inventory — no `requirements.txt`/`pyproject.toml` existed anywhere in this backend before now, a standing gap noted in prior review; adding a genuinely new dependency was the natural moment to also close that), `schemas/system_metrics.py`, `api/system_metrics.py` (`GET /system-metrics/summary`, `require_role("admin")`). Service checks: CPU % and core count, memory/disk used-vs-total, and three service-reachability probes (API — trivially operational, since this code only runs if the API process is up; Database — a real `SELECT 1`; Ollama — a real, short-timeout `GET .../api/tags`). **GPU is an honestly-labelled placeholder** (`{"available": false, "status": "not_configured"}`) — objective #7 itself named it "Future GPU support"; querying `nvidia-smi` on a host with no GPU would only add a dependency for a feature nothing here uses yet.

**Frontend:** `lib/api/systemMetrics.js`, `SystemMetricsPanel.js`, wired into the platform-health page gated on the caller's JWT role (checked before fetching, not just relying on the backend's 403 — the same "don't make a Server Component fetch data a non-admin's rendered page never shows anyway" discipline Packages 9/H already established for their own admin pages).

## 9. Retroactive consistency fixes (Package Q)

While extending the model-import lists this package's own new models needed (`create_tables.py`, `alembic/env.py`, `tests/test_migrations.py`), it became clear Package Q's own three new models (`WorkerPackAddOn`, `WorkerPackProvisioning`, `OrganisationOnboardingTask`) had never been added to any of those three files — harmless in the full test suite (another test file's `client` fixture imports `main`, which transitively imports every model before `test_migrations.py`'s own function runs, masking the gap), but a real bug when `test_migrations.py` runs in isolation (confirmed by reproducing it: `pytest tests/test_migrations.py` alone failed before this fix, passed after). Fixed as a small, low-risk side effect of doing the same work for this package's own new models, not a separate initiative.

## 10. Validation

### Backend
`python -m alembic heads` — single head (`7a1c9e4d5b62`, three new migrations this package: `trial_ends_at`, `password_reset_tokens`, plus the pre-existing chain). `python -m pytest` — 6 new test files (`test_system_metrics.py`, `test_trial_signup.py`, `test_password_reset.py`, plus the `test_migrations.py` fix) covering every new endpoint and the admin-only gate; full-suite run in progress at time of writing, no regressions found in any targeted or full run so far. Migrations applied cleanly to the real dev database.

### Frontend
`npm run lint` — zero warnings throughout. `npm test` — 295 passing (a new `lib/api/__tests__/systemMetrics.test.js`; `lib/api/auth.js`'s three new functions inherit that file's existing, pre-established "cookie-touching helpers untested by `node:test`" exception, since importing the module at all requires `next/headers`). `npm run build` — clean from a fresh `.next`, every new route present in the manifest.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001, to avoid the project owner's own running instance on port 8000) and frontend (port 3100, to avoid their own session on port 3000) against the real dev Postgres database:

- Signed up a trial organisation via the real `/signup/trial` endpoint — confirmed `status="trial"` and a real `trial_ends_at` ~14 days out on `GET /organisations/`.
- Confirmed `/auth/forgot-password` returns byte-identical responses for a known and an unknown email.
- Confirmed `GET /system-metrics/summary` returns real host CPU/memory/disk figures and a real Ollama reachability check (`operational`, 8ms — this dev environment has Ollama running) as an admin.
- **Found and fixed a real bug during this verification**: `middleware.js`'s public-path allowlist only exempted the literal `/portal/login` path — the three new public pages (`/portal/start-trial`, `/portal/forgot-password`, `/portal/reset-password`) all redirected to login before this fix, confirmed live via `curl` (307 before, 200 after).
- Signed up a trial through the *real frontend* (not the backend directly) — confirmed a real session cookie was set, the dashboard rendered a real "Trial — 14 days remaining" banner, the grouped nav rendered all four groups plus the brand link, and the Orchestration rename appeared with zero remaining "CTO Orchestration" text.
- All verification data was deleted from the real dev database afterward; both temporary server instances were stopped by exact PID after confirming via `ss -tlnp` which process owned which port — the project owner's own backend (port 8000) and frontend (port 3000, active on a real attached terminal) were left completely untouched throughout.

## 11. Explicitly not done

- **No marketing-site changes of any kind** — `SecurityOS AI` remains exactly as it was; ADR-001 stands.
- **No email-sending integration** — the password reset *mechanism* is real; delivery is not. Still the standing gap flagged since Package O.
- **No trial enforcement** — nothing blocks or downgrades access once `trial_ends_at` passes. A foundation, not a lifecycle.
- **No new icon-library dependency** — a small self-authored SVG set instead.
- **No GPU metrics** — an honest, explicitly-labelled placeholder.
- **No changes to `RenewalWizard.js`/`OwnershipTransferWizard.js`** (Package Q's own prior scope note stands unchanged) or to any backend entitlement-enforcement scope from Package Q.
- **No staff-facing frontend** — still API-only, unchanged from every prior package.
