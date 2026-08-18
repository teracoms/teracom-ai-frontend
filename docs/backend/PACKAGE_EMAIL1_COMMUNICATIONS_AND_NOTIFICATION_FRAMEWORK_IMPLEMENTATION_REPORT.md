# Package EMAIL1: Communications and Notification Framework — Implementation Report

**Date:** 2026-08-18 · **Type:** Full-stack (`teracom-ai-backend` + `teracom-ai-frontend`) · **Status:** Implemented, tested, live-verified against real running services. **Not yet committed** — held for approval per this project's established pattern.

---

## 1. Objectives

Twelve objectives: real delivery for the five email/notification types this backend already triggers (password reset, welcome, trial signup, trial expiry), two new lead-notification workflows (Contact Sales, Demo Request), two onboarding-email workflows (Customer onboarding, Customer Success onboarding), real notification templates, an email-delivery architecture review, real audit/delivery tracking, and a communication timeline integrated into the product. Requirements: preserve existing functionality, both test suites passing, clean builds, prepare for future Microsoft 365 integration, focus on customer-communication readiness.

## 2. A scope decision made before writing any code: objectives 7 and 8

The brief names "Customer onboarding emails" (objective 7) and "Customer Success onboarding emails" (objective 8) as two distinct items. This backend has two, genuinely separate onboarding concepts that map cleanly onto them, confirmed by reading both services directly before assuming:

- **Objective 7 → `OrganisationOnboardingTask`** (Package Q) — the self-service welcome checklist auto-seeded when an organisation's own licence activates (`services/organisation_onboarding_service.py`). This is the organisation's *own* onboarding into the platform.
- **Objective 8 → `OnboardingTask`** (Package J) — the Customer Success department's own checklist for a tenant's *own* customer becoming a paying customer (`services/onboarding_service.py`, tied to a `CrmContact`). This is a tenant *onboarding its own customer*, a different relationship entirely.

Both are real, pre-existing, and previously had zero email coverage. This reading is more consistent with each package's own established naming ("Customer Success" is Package J's own department/persona name) than the alternative (treating both objectives as the same entity). Documented here rather than assumed silently.

## 3. What changed — backend

**Real email provider architecture** (objective #10 — a genuine architecture, not a placeholder):
- `services/email_provider.py` — a small `EmailProvider` interface; `SmtpEmailProvider` (real, working, stdlib-only `smtplib` client — no third-party dependency); `LoggingEmailProvider` (the exact pre-EMAIL1 behaviour, kept as its own explicit provider). `get_email_provider()` selects based on whether `SMTP_HOST` is configured — empty in this environment (no real credentials exist here), so it falls back to logging, the same honest "mechanism real, credential not available yet" pattern this codebase already uses for licensing signing keys and external AI providers.
- **Prepared for Microsoft 365**: `SmtpEmailProvider` works against *any* SMTP-capable mailbox, Microsoft 365's own SMTP AUTH endpoint (`smtp.office365.com:587`) included — pointing `SMTP_HOST`/`SMTP_USERNAME`/`SMTP_PASSWORD` at a real Microsoft 365 mailbox requires zero code changes. A future, richer Microsoft Graph-based provider (using `/sendMail` instead of SMTP) would implement the same `EmailProvider` interface with no caller changes needed — the exact "swap one function" design this package's own predecessor established.

**Real templates** (objective #9): `services/email_templates.py` — real, human-written HTML+text content for all eleven template types (five pre-existing, six new), sharing one visual shell so a future design pass touches one place, not eleven.

**Real delivery/audit tracking** (objective #11): `EmailMessage` gained `delivered_at`, `error_message`, `provider` columns (migration `4d8a2f61c7b3`). `status` now genuinely reflects outcome — `"sent"` (a real provider accepted it), `"failed"` (with the real error recorded), or `"logged"` (no provider configured) — not always `"logged"` as before.

**New notification triggers**:
- `notify_trial_expiring_soon()` — a new, one-time, *proactive* notice fired `TRIAL_EXPIRING_SOON_DAYS` (default 3) before `trial_ends_at`, genuinely distinct from the two existing *reactive* trial notices (which only fire after access has already changed). New `Organisation.trial_expiring_soon_notified_at` column guards it to once.
- `notify_contact_sales_lead()` / `notify_demo_request_lead()` — fired from `services/lead_service.py#create_lead()` when `inquiry_type` is `"contact_sales"`/`"demo_request"` respectively (every other inquiry type is unaffected — general enquiries aren't actionable sales workflows). Recipient is a new `SALES_NOTIFICATION_EMAIL` config var, empty by default since no real sales mailbox exists in this environment; the `NotificationLog` audit trail is recorded either way, live-verified both with and without a configured recipient.
- `notify_organisation_onboarding_seeded()` / `notify_organisation_onboarding_completed()` — wired into `api/staff_licence_requests.py` (fires on first licence activation) and `api/organisation_onboarding.py` (fires when the pending-task count transitions to zero).
- `notify_customer_success_onboarding_started()` — wired into `api/onboarding_tasks.py`'s seed route, sent directly to the `CrmContact`'s own email (a new `recipient_type="crm_contact"` value — the first notification in this backend sent to a tenant's own customer rather than an internal identity). Skips gracefully (not an error) when the contact has no email on file.

**Communication timeline** (objective #12): `services/communication_service.py` + two new endpoints — `GET /organisation-notifications/` (admin-only, an organisation's own welcome/trial/onboarding history with real delivery status) and `GET /crm/contacts/{id}/communications` (every email sent directly to one contact).

## 4. What changed — frontend

- `lib/api/communications.js` — the two new endpoints' client functions.
- `components/portal/CommunicationsPanel.js` — a shared, presentational timeline renderer (status badges, delivery errors) reused by both surfaces below.
- A new admin-only page, `/portal/admin/communications` (added to `PortalNav.js`'s Platform group), showing an organisation's own communication history.
- A new "Communications" section on the existing Sales contact detail page (`/portal/sales/[contactId]`), showing that specific contact's own email history — the natural home for objective #8's own emails.

## 5. Live verification

All of the following were confirmed against the real running services, using throwaway data created for this purpose and fully deleted afterward:

- **Lead → sales notification, both configured and unconfigured**: submitted a real Contact Sales lead via the actual homepage form with no `SALES_NOTIFICATION_EMAIL` set — confirmed a real `NotificationLog` row with no linked email (honest, not silently dropped). Then configured a real recipient, restarted, submitted a real Demo Request lead, and confirmed a fully real pipeline: correct rendered subject, `provider="log"`, `status="logged"` (since no SMTP credentials exist in this environment — exactly the expected, honest outcome). Reverted the config afterward to this environment's real, honest empty state.
- **Trial welcome, via the real admin communications page**: a real trial signup's welcome notice rendered correctly on the new `/portal/admin/communications` page with the real subject and an honest "Logged (no provider configured)" status label.
- **Customer Success onboarding notice, via the real Sales contact page**: created a real `CrmContact` with an email, seeded its onboarding checklist via the real backend, and confirmed the personalized "Welcome aboard, Verify Customer" notice rendered on the actual `/portal/sales/{contactId}` page's new Communications section.
- **Cleanup**: every organisation/user/contact/lead/notification/email row created for this verification pass was deleted from the real dev database afterward; confirmed zero remaining.

## 6. Final validation

- **Backend**: full suite, 254/254 passing (19 new tests for EMAIL1 — the provider architecture with a mocked `smtplib.SMTP`, template rendering, every new notification trigger, and the two new endpoints; the previously-observed Ollama-timing flake did not recur on this run).
- **Frontend**: `npm run lint` — zero warnings. `npm test` — 302/302 passing (2 new). `npm run build` — clean from a fresh `.next`, confirmed the new `/portal/admin/communications` route in the build output.

## 7. Explicitly not done

- **No real SMTP credentials are configured in this environment** — every live-verified send used the honest `"logged"` fallback. The architecture is real and ready; the credential is a business/IT dependency (a real mailbox, real Microsoft 365 tenant credentials, or an SMTP relay), not something this package can fabricate.
- **A real Microsoft Graph email provider** — deliberately not built. `SmtpEmailProvider` already satisfies "prepare for future Microsoft 365 integration" for email specifically (SMTP AUTH works against a real Microsoft 365 mailbox today); a Graph-based provider is separate, larger work (Azure AD app registration, OAuth) tracked under Package FEDERATION2's own assessment, not duplicated here.
- **Per-task completion emails for Customer Success onboarding** (`OnboardingTask`) — only the "started" notice was built; four separate completion emails per contact was judged noisy and not clearly requested. The organisation-level "completed" milestone (objective 7's own checklist) *was* built, since it's a single, real milestone rather than four repeats.
- **Retry/backoff for failed sends** — a `SmtpEmailProvider` failure is recorded (`status="failed"`, `error_message`) but not automatically retried. No background scheduler exists in this backend to drive a retry queue (a standing, pre-existing gap); building one was out of this package's own scope.
- **Password-reset notifications remaining outside the new organisation-scoped communications timeline** — unchanged from before this package; see `services/communication_service.py`'s own docstring for why (not organisation-scoped to begin with, and an auth event rather than a customer communication).

## 8. Commit status

**Nothing in this package has been committed or pushed.** All backend and frontend changes exist only as uncommitted working-tree changes, held pending explicit user approval, per this project's established pattern.
