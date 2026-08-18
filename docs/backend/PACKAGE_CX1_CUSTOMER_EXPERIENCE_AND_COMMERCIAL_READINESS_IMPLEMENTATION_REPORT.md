# Package CX1: Customer Experience & Commercial Readiness Wave — Implementation Report

**Date:** 2026-08-18 · **Type:** Full-stack (`teracom-ai-backend` + `teracom-ai-frontend`) · **Status:** Implemented, tested, live-verified against real running production services. **Not yet committed** — held for approval per explicit instruction.

---

## 1. Objectives

17 objectives were given (an 18th was submitted blank and confirmed dropped — "there is no 18th objective"), covering: Forgot/Reset Password for both identity planes, an email-delivery foundation, a Welcome email, Trial Signup/Organisation/Expiry/worker-allocation, an AI Concierge foundation, Contact Sales/Demo Request capture, and Customer Onboarding/Success/Support/Incident/Communications/Notification framework touchpoints. Four blocking questions were resolved before writing code:

1. **Email delivery** — build the abstraction only; no real SMTP/provider integration. Every "email" is a real, persisted `EmailMessage` row with `status="logged"`, never `"sent"`.
2. **AI Concierge** — foundation only: a real interactive widget routing to existing real actions (Start Trial / Request Demo / Talk to Sales / FAQ), no live LLM behind it.
3. **Trial expiry** — a grace period, then Locked Mode, not an immediate hard cutoff or a silent no-op.
4. **Objective 18** — dropped; confirmed it doesn't exist.

## 2. What changed — backend

**New models:** `EmailMessage` (`models/email_message.py`), `NotificationLog` (`models/notification_log.py`), `PortalContactPasswordResetToken` (`models/portal_contact_password_reset_token.py` — deliberately separate from `models/password_reset_token.py`, this codebase's standing rule that identity planes never share a code path), `Lead` (`models/lead.py` — no `organisation_id`; a Teracom-side top-of-funnel inquiry, distinct from a tenant's own `CrmContact`). `Organisation` gained `trial_grace_notified_at`/`trial_locked_notified_at` (nullable timestamps, used only to fire each lifecycle notification exactly once).

**New services:**
- `services/email_service.py#send_email()` — persists an `EmailMessage`, logs it via `logger.info`, returns the row. `_dispatch()`'s own docstring states plainly that no provider is configured.
- `services/notification_service.py` — `notify_welcome()`, `notify_portal_contact_welcome()`, `notify_password_reset_requested()`, `notify_trial_grace_period_started()`, `notify_trial_locked()` (the latter two email every admin on the organisation). Every call writes a `NotificationLog` row alongside the `EmailMessage`.
- `services/trial_service.py` — `get_trial_status()` computes `"active"`/`"grace"`/`"locked"` fresh on every call from `trial_ends_at + TRIAL_GRACE_PERIOD_DAYS` (7 days), never stored — the same computed-not-stored pattern `licence_validation_service.py` already uses, necessary because this backend has no background scheduler. `apply_trial_lifecycle_notifications()` fires the grace/locked notification exactly once per organisation (guarded by the two new timestamp columns). `assert_trial_not_locked()`/`assert_trial_worker_capacity()` raise `TrialLockedError`, caught at the API layer and turned into a 403.
- `services/portal_contact_password_reset_service.py` — mirrors `services/password_reset_service.py` exactly, for the `PortalContact` plane.
- `services/lead_service.py` — `create_lead()`/`list_leads()`/`mark_lead_contacted()`.

**Wired into existing services:** `signup.py` now calls `notify_welcome()`; `portal_contact_service.py#create_portal_account()` now calls `notify_portal_contact_welcome()`; `password_reset_service.py#request_password_reset()` now calls `notify_password_reset_requested()`; `worker_pack_provisioning_service.py` gained an `is_trial` branch — trial organisations bypass the entitlement/licence requirement entirely and are checked against `assert_trial_worker_capacity()` per persona template instead, since a trial is explicitly not a commercial commitment (`LICENSING_MODEL_V1.md` §9's human-approval principle is not this path's to invoke); `api/workers.py#create_worker()` now calls `assert_trial_not_locked()`/`assert_trial_worker_capacity()`; `api/auth.py#me()` now calls `apply_trial_lifecycle_notifications()` for trial organisations; `api/organisations.py#get_organisations()` now injects a computed `trial_status` field into the response.

**New endpoints:** `POST /portal-contact/forgot-password`, `POST /portal-contact/reset-password` (`api/portal_contact_auth.py`); `POST /leads/` (`api/leads.py`, public, dedicated rate limiter); `GET /staff/leads`, `POST /staff/leads/{id}/contacted` (`api/staff_leads.py`); `GET /staff/notifications` (`api/staff_notifications.py`).

**Config:** `TRIAL_GRACE_PERIOD_DAYS=7`, `TRIAL_WORKER_LIMIT=3`, `LEAD_MAX_ATTEMPTS=10`, `LEAD_ATTEMPT_WINDOW_SECONDS=3600`, `LEAD_LOCKOUT_SECONDS=3600`.

**Migration** `alembic/versions/2f5a8c1d9e33_add_customer_experience_and_commercial.py` — creates `email_messages`, `notification_logs`, `portal_contact_password_reset_tokens`, `leads`, plus the two new `organisations` columns. Applied to the real dev database (`alembic upgrade head` → head is `2f5a8c1d9e33`). `create_tables.py`, `alembic/env.py`, and `tests/test_migrations.py#_expected_tables()` were all proactively updated with the four new models — a lesson learned the hard way in Package Q and applied up front this time rather than retroactively.

## 3. What changed — frontend

- `lib/api/portalContactAuth.js` — `requestPortalContactPasswordReset()`, `confirmPortalContactPasswordReset()`.
- `lib/api/leads.js` (new) — `submitLead()`.
- `app/api/portal-contact/{forgot-password,reset-password}/route.js`, `components/customer-portal/PortalContact{ForgotPassword,ResetPassword}Form.js`, `app/customer-portal/(public)/{forgot-password,reset-password}/page.js` — full mirror of the internal `/portal` password-recovery flow for the `PortalContact` plane. `app/customer-portal/(public)/login/page.js` gained the "Forgot password?" link.
- `middleware.js` — `PUBLIC_CUSTOMER_PORTAL_PATHS` now a `Set` covering `/customer-portal/{login,forgot-password,reset-password}`, replacing a single-path check — the same bug shape Platform Review Wave 1 already found and fixed once for the internal `/portal` middleware, now closed for the customer-portal side before it ever shipped broken.
- `app/api/leads/route.js` — rewritten to call the real backend (`submitLead()`) instead of `console.log`; maps a form's `interest` field to the backend's `INQUIRY_TYPES` enum; redirects to `/?lead=received#contact` or `/?lead=error#contact`.
- `components/portal/AiConciergePlaceholder.js` — rewritten from a disabled placeholder into a real interactive widget: a `FAQS` object (trial/platform topic arrays), Start Trial / Request Demo / Talk to Sales links to real routes, an expandable FAQ panel.
- `app/globals.css` — `.mini-services` extended from `span`-only to `span,a,button` with hover/active states, reused by the concierge widget rather than adding new CSS.
- `app/page.js` (homepage) — reads `?lead=received`/`?lead=error`/`?interest=` search params; renders a real success/error banner; contact `<select>` gained "Talk to Sales"/"Request Demo" options with `defaultValue` support for deep-linking.
- `app/portal/(public)/login/page.js` — Request Demo/Contact Sales links now deep-link into the homepage contact form via `?interest=`.
- `components/portal/OrganisationSummaryCard.js` — now renders the backend-computed `organisation.trial_status` (`"active"`/`"grace"`/`"locked"`) via a `TRIAL_BANNER_TEXT` mapping, instead of a client-side days-remaining calculation alone.

## 4. Real bugs found and fixed during testing (not just written and assumed correct)

1. **Forgotten notification hook.** `password_reset_service.py#request_password_reset()` didn't call `notify_password_reset_requested()` — caught by `tests/test_email_notifications.py` failing, fixed by adding the call.
2. **Shared rate-limiter instance across identity planes.** `api/portal_contact_auth.py` originally imported and reused `password_reset_rate_limiter` — the same instance `api/auth.py`'s internal-`User` forgot-password endpoint uses — instead of a dedicated one. This violates the codebase's core rule that identity planes never share state: an IP resetting a `PortalContact` password could lock itself out of resetting an unrelated internal `User`'s password, or vice versa. Caught by a full-suite background run (passed in isolation, failed in the full 222-test run — order/state-dependent, since the rate limiter is a real process-wide singleton with no per-test reset). Fixed by adding a dedicated `portal_contact_password_reset_rate_limiter` instance in `auth/rate_limit.py` and repointing the endpoint at it. A regression test (`test_rate_limiter_instance_is_isolated_from_the_internal_user_one`) now asserts the two objects are never the same instance and that exhausting one's budget never affects the other — written as a deterministic unit test against the limiter objects themselves (fake TEST-NET-3 IP), not an HTTP-level loop, because an HTTP-level version of this exact test was itself the next bug (below).
3. **The regression test for bug #2 was itself flaky.** Its first version made real HTTP calls assuming a *fresh* limiter state; other tests in the same suite run had already partially consumed the same global budget, so the assumption broke under full-suite ordering. Rewritten as a pure unit test against the limiter objects — deterministic, zero side effects on the rest of the suite. Verified clean across two subsequent full-suite runs (222/222, then 222/222 again).

One pre-existing, unrelated flaky test was observed (`test_marketing.py::test_ai_drafted_video_script_informed_by_approved_content`, failed once, passed on retry and on both subsequent full runs) — confirmed via source review to be real-Ollama-response non-determinism under a long resource-heavy suite run, not caused by anything in this package.

## 5. The mid-wave production incident (frontend stale build)

Mid-implementation, a user-reported incident interrupted this package: the production frontend was serving `ENOENT` errors on webpack cache files and 404s on `/_next/static/*` assets. **Root cause:** `teracom-frontend.service` had been running continuously since before this session's frontend edits began; `rm -rf .next && npm run build` was run multiple times afterward without restarting the service, so by the time of the report the long-running process had a completely different `BUILD_ID` in memory than what was on disk — stale content-hash chunks 404'd, and cache files referenced by the old process no longer existed. **Fix:** one final clean `.next` rebuild, then `systemctl --user restart teracom-frontend.service`. Verified (not assumed): service start time postdated the build; homepage, `/portal/login`, and every individual `/_next/static/*` path referenced in the live homepage HTML were curled and confirmed 200; zero errors in `journalctl` since restart. This package's own final build (§8) deliberately repeated the restart step immediately after rebuilding, specifically to avoid recreating the same incident.

## 6. Gaps found and fixed while resuming for live verification

Two further stale-state issues surfaced when resuming this wave for live verification, both fixed before any verification was attempted:

- **`teracom-backend.service` had been running since before this wave's backend code was written** — serving pre-wave code the entire implementation. Restarted; confirmed `/docs` responds and the new routes (`POST /leads/`, `POST /portal-contact/forgot-password`) are live.
- **A leftover `frontend/.env.local` (from earlier throwaway testing, before the incident in §5) contained `BACKEND_API_URL=http://localhost:8001`** — a dead port, silently overriding the correct backend URL via Next.js's `.env.local` > `.env` precedence. This caused a live trial-signup attempt to fail with `502 Bad Gateway` / `"Unable to reach the Teracom AI backend."`. Deleted. **Deeper gap found in the process: no real `.env` file existed in the frontend directory at all — only `.env.example`.** Production connectivity had only ever worked by accident of whatever `.env.local` happened to be left behind from a prior session's testing — a real, previously-unaddressed operational gap that Package OPS1's own runbook didn't catch. Fixed by creating a real, persistent `frontend/.env` (copied from `.env.example`'s own documented defaults: `BACKEND_API_URL=http://localhost:8000`, `NEXT_PUBLIC_SITE_URL`, and placeholder Stripe/Zoho/admin-import values — none of which are wired to anything real in this environment). Frontend service restarted; trial signup re-attempted and succeeded.

## 7. Live verification

Every objective below was exercised against the real running `teracom-backend.service` and `teracom-frontend.service` — not `TestClient`, not a mock — using a throwaway organisation/contact/lead created for this purpose and fully deleted from the database afterward (§7's final note).

- **Trial signup**, via `POST http://127.0.0.1:3000/api/auth/signup-trial`: `200`, real session cookie issued, `trial_ends_at` ≈ 14 days out.
- **Portal dashboard**, with that real session: `200`, organisation name rendered, "days remaining" trial banner shown (active state).
- **Trial grace period**: `organisations.trial_ends_at` set 2 days into the past directly in Postgres (simulating elapsed time, since no scheduler exists to advance it); dashboard reload showed the `grace` banner ("Contact Teracom"); `notification_logs` confirmed exactly one `trial_grace_period_started` row fired.
- **Trial locked mode**: `trial_ends_at` pushed to 20 days past; dashboard reload showed "Locked Mode"; exactly one `trial_locked` notification fired; a real `POST /workers/` call against the live backend with a valid admin JWT returned `403` with the exact configured message.
- **Trial worker limit**: trial reset to active (10 days remaining); 3 consecutive `POST /workers/` calls succeeded (`200`), the 4th returned `403` — matching `TRIAL_WORKER_LIMIT=3` exactly.
- **PortalContact forgot/reset password**, full round trip through the real frontend: created a `PortalContact` account via the real backend; `POST /api/portal-contact/forgot-password` (real frontend route) returned `200`; a raw reset token was obtained via the service layer (the same mechanism an email would carry, since no provider exists — §1); `POST /api/portal-contact/reset-password` (real frontend route) returned `200`; login with the new password succeeded (`200`) and login with the old password was rejected (`401`) — both through the real frontend's `/api/customer-portal-auth/login` route.
- **Leads capture**, via the real contact form's backend route (`POST /api/leads`): `303` redirect to `/?lead=received#contact`; the row landed in Postgres with the correct `inquiry_type` mapping (`contact_sales`); the homepage rendered the real success banner text ("Thanks — we've received your enquiry and will be in touch shortly.").
- **AI Concierge widget**: confirmed rendering on the live `/portal/login` page with all four expected elements (`AI Concierge`, `Start Trial`, `Request Demo`, `Talk to Sales`).
- **Staff notifications/leads endpoints**: confirmed both `401` unauthenticated and, using a real staff JWT minted for the existing bootstrap staff account, `200` with real data — every notification fired during this verification pass (`welcome` ×2, `trial_grace_period_started`, `trial_locked`, `password_reset_requested` ×2) was visible via `GET /staff/notifications`; the test lead was visible via `GET /staff/leads` and successfully marked contacted via `POST /staff/leads/{id}/contacted`.
- **Cleanup**: every row created for this verification pass (organisation, users, workers, CRM contact, portal contact, reset tokens, email messages, notification logs, lead, audit-log rows) was deleted from the real dev database afterward; confirmed zero remaining via direct query.

## 8. Final validation

- **Backend**: full suite, 222/222 passing, two clean consecutive full runs after the fixes in §4.
- **Frontend**: `npm run lint` — zero warnings. `npm test` — 296/296 passing. `npm run build` — clean from a fresh `.next`, followed immediately by a `teracom-frontend.service` restart (per §5's lesson) and a live re-check of the homepage, `/portal/login`, and a real static asset path, all `200`, zero errors in `journalctl`.

## 9. Explicitly not done

- **No real email provider** — every "sent" email is a persisted, logged `EmailMessage` row only. Per-recipient delivery (SMTP/SES/SendGrid/etc.) remains a standing gap, now blocking three things instead of two: `PortalContact` password recovery delivery, internal-`User` password recovery delivery (Platform Review Wave 1), and every notification this package adds (welcome, trial lifecycle).
- **No live LLM behind the AI Concierge** — it is a real, interactive, statically-authored FAQ/routing widget, not a chat interface. Building an actual conversational concierge is a distinct, larger piece of work.
- **No update/delete endpoint for `Lead`** beyond `mark_lead_contacted()` — the same "create and read/decide only" gap this project has flagged for every other new entity since Package J.
- **Trial worker limit is enforced only on `POST /workers/`**, not retrofitted onto the pre-existing `WorkerCreationRequest` approval path or Marketplace-pack provisioning's own non-trial entitlement check (the latter already has its own, separate enforcement — see `worker_pack_provisioning_service.py`'s pre-existing entitlement branch, untouched by this package for non-trial organisations).
- **No background scheduler** — trial status is computed fresh on every relevant request (`get_trial_status()`), not advanced by a cron/worker process. An organisation whose admin never logs in and is never queried will not have its lifecycle notification fired until someone does.
- **Commercial billing** (price, invoicing, subscriptions, payment) remains entirely out of scope, as it has been for every package since Package Q's own explicit exclusion.

## 10. Commit status

**Nothing in this package has been committed or pushed.** All backend and frontend changes exist only as uncommitted working-tree changes, held pending explicit user approval per this wave's own instruction ("Return for approval once complete").
