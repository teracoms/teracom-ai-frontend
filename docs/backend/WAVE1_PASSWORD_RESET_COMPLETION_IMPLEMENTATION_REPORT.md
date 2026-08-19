# Wave 1, Workstream 3 — Password Reset Completion — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (all code changes); `teracom-ai-frontend` (governance docs only — confirmed by direct inspection that no frontend code change was needed). **Source:** `IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §3, itself derived from `INTERNAL_PILOT_READINESS_ASSESSMENT.md`'s findings. **Scope:** exactly the defect named in the plan — the reset token/link never reaching the outbound email, on both identity planes.

---

## 1. Root cause, confirmed by direct code reading before any change was made

On the internal-User plane, `services/notification_service.py#notify_password_reset_requested()` called `send_email(..., context={})` — hardcoded empty. `services/email_templates.py#_password_reset_requested()` accepted a `context: dict` parameter but never read anything from it, and its body literally told the recipient to "use the link your administrator provides" — no link, ever, in any environment, with or without real SMTP.

Tracing further up the call chain: `services/password_reset_service.py#request_password_reset()` generates a genuine `raw_token = secrets.token_urlsafe(32)`, persists its hash, and then calls `notify_password_reset_requested("user", user.id, user.email, db)` — **without passing `raw_token` at all**. The route handler (`api/auth.py#forgot_password()`) calls `request_password_reset(payload.email, db)` and discards its return value entirely. The token is generated, hashed into the database, and then dropped on the floor — it never reaches the email layer by any path.

The identical defect exists, independently, on the PortalContact plane (`services/portal_contact_password_reset_service.py#request_portal_contact_password_reset()` and `api/portal_contact_auth.py#portal_contact_forgot_password()`) — both planes share the same `notify_password_reset_requested()` function and the same email template, so the fix is shared too.

**This defect is independent of Workstream 2's SMTP-credential question.** Even with a real, fully-configured SMTP provider, the email sent would have been identical and still contained no working link — this is a content defect, not a delivery defect.

---

## 2. What was implemented

1. **New config setting.** `backend/config.py` gained `FRONTEND_BASE_URL` (default `http://localhost:3000`), added to both `.env` (this environment's real value, matching the frontend's own `NEXT_PUBLIC_SITE_URL=https://www.teracomsolutions.com.au`) and `.env.example`. Confirmed by direct search that no existing config value could be reused — this is the first place the backend has ever needed to construct a link back to the frontend.
2. **`services/password_reset_service.py#request_password_reset()`** — builds `reset_url = f"{FRONTEND_BASE_URL}/portal/reset-password?token={raw_token}"` immediately after the token is created, while it's still in scope, and passes it to `notify_password_reset_requested()`.
3. **`services/portal_contact_password_reset_service.py#request_portal_contact_password_reset()`** — identical fix, building `f"{FRONTEND_BASE_URL}/customer-portal/reset-password?token={raw_token}"`.
4. **`services/notification_service.py#notify_password_reset_requested()`** — signature extended with a new `reset_url: str` parameter, now passed as `context={"reset_url": reset_url}` instead of the hardcoded `context={}`.
5. **`services/email_templates.py#_password_reset_requested()`** — rewritten to read `context.get("reset_url")` and render a real HTML button/link plus a plain-text URL, replacing "use the link your administrator provides." A defensive fallback branch (matching this codebase's existing `.get()`-with-default style) covers the case where `reset_url` is somehow absent — not expected to be reachable in practice, since every real caller now supplies it.
6. **Stale docstring corrected.** `models/password_reset_token.py`'s class docstring previously stated "only the delivery channel... is not [built]" — updated to reflect that the delivery *mechanism* (URL construction and template rendering) is now real; only a real SMTP credential remains missing (Workstream 2's own finding, unchanged by this workstream).
7. **Frontend: confirmed, not assumed, that no change was needed.** Both `app/portal/(public)/reset-password/page.js` and `app/customer-portal/(public)/reset-password/page.js` were inspected directly — both already read a `?token=` query parameter and already call their respective real backend-confirming endpoint via existing BFF proxy routes (`app/api/auth/reset-password/route.js`, `app/api/portal-contact/reset-password/route.js`). The URL shapes this workstream now emails out (`/portal/reset-password?token=...`, `/customer-portal/reset-password?token=...`) match exactly what these pages already expect.

---

## 3. Tests

Two new tests, one per identity plane, both passing:

- `tests/test_password_reset.py::test_password_reset_email_contains_a_real_working_link_with_the_raw_token`
- `tests/test_portal_contact_password_reset.py::test_password_reset_email_contains_a_real_working_link_with_the_raw_token`

Each calls the real service function directly (matching the existing direct-service-call test pattern in both files), then:
1. Queries the persisted `EmailMessage` row and asserts `template_context["reset_url"]` equals the expected, fully-constructed URL containing the real raw token — not a placeholder, not empty.
2. Calls `render_template()` directly and asserts the expected URL appears in **both** the rendered HTML and plain-text bodies.
3. Asserts the old, literal broken copy ("your administrator provides") is gone.

This tests both the data layer (what's actually persisted and would be handed to any provider) and the presentation layer (what the recipient would actually see), not just that a function was called.

---

## 4. Validation

- **Backend:** full suite run — 260/260 passing (258 before this workstream, +2 new). Zero regressions.
- **Frontend:** 302/302 passing, unchanged — confirmed no frontend code required any change, per §2 item 7 above.
- Migration-chain discipline confirmed not implicated: no new column, table, or model was added — only a new plain config value and code changes to existing functions.

---

## 5. What was not done, and why

- **Real SMTP credentials remain unconfigured** — unchanged from Workstream 2, and outside this workstream's scope. This fix makes the email *content* correct; Workstream 2 already made the *delivery mechanism* provably correct. Both remain gated on a real external mailbox/relay credential this session cannot provision.
- **No frontend code was changed** — confirmed unnecessary, not skipped for lack of time.

---

## 6. Commit status

Backend changes complete and tested. Frontend: governance docs (`CURRENT_SPRINT.md`, `PROJECT_STATE.md`, `ARCHITECTURE_DECISIONS.md` ADR-030, `CHANGELOG.md`) updated, plus this report. Both repos ready to commit locally. **Not pushed** — awaiting approval, per instruction ("await approval before push").
