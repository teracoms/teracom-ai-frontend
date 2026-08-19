# Wave 1, Workstream 2 — SMTP Completion — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (test + governance docs); `teracom-ai-frontend` (governance docs only — no frontend code changed, no frontend code required). **Source:** `IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §2. **Scope:** SMTP delivery completion, exactly as scoped in the plan — a configuration and verification task, not an engineering one, since `SmtpEmailProvider` already exists and already works.

---

## 1. What this workstream actually is

`IMPLEMENTATION_PLAN.md` itself anticipated this correctly: "This is a configuration and verification task, not an engineering task — the provider abstraction already branches correctly on `SMTP_HOST`'s presence and requires no code change either way." That was confirmed by direct re-reading of `services/email_provider.py` before starting: `get_email_provider()` returns `SmtpEmailProvider` whenever `SMTP_HOST` is set, and `SmtpEmailProvider.send()` already handles STARTTLS, optional login, and `sendmail()` generically — no Microsoft-specific or provider-specific code exists or is needed.

**What remained genuinely undone, and what this workstream addresses:**
1. The provider's correctness had only ever been verified against a fully-mocked `smtplib.SMTP` — no test proved a real SMTP wire exchange actually completes.
2. No document existed spelling out the exact steps to go from "mechanism exists" to "real email delivers," for whoever holds a real mailbox/relay credential.
3. Real credential provisioning itself — which requires an actual external account (a Microsoft 365 mailbox, a SendGrid/Postmark/SES account, or similar) that this coding session has no access to create or authenticate with.

Item 3 is stated plainly and is **not resolved by this workstream** — it cannot be, without access this session doesn't have. Items 1 and 2 are fully addressed below.

---

## 2. What was implemented

### 2a. A real TCP/SMTP wire-level test

Added to `tests/test_email_provider.py`:
- `_MinimalSmtpServer` — a small (~50 line), stdlib-only fake SMTP listener using a raw `socket`, implementing just enough of the protocol (EHLO, DATA, QUIT) for `smtplib.SMTP.sendmail()` to complete a genuine handshake against it. Written directly in the test file rather than adding a dependency: Python 3.12 removed the stdlib `smtpd` module, and `aiosmtpd` is not a project dependency — installing it purely for one test was judged not worth a new dependency when ~50 lines of stdlib code does the job.
- `test_smtp_provider_completes_a_real_wire_level_handshake_against_a_live_socket` — points a real `SmtpEmailProvider` instance at `127.0.0.1:<the fake server's port>`, calls `.send()`, and asserts the fake server's captured raw message actually contains the expected `From`/`To`/`Subject`/body content. This is the one test in the file that doesn't mock `smtplib.SMTP` — every other test in this file does, proving only that the right calls happen, not that a real exchange completes.

### 2b. Activation runbook

Added `docs/operations/PRODUCTION_RUNBOOK.md` §9 ("SMTP / email delivery activation"): the exact `.env` variables to set (`SMTP_HOST`/`PORT`/`USERNAME`/`PASSWORD`/`USE_TLS`/`FROM_EMAIL`/`FROM_NAME`/`SALES_NOTIFICATION_EMAIL`), the documented Microsoft 365 target with its specific real-world caveat (SMTP AUTH is often disabled by default per-tenant and must be explicitly enabled for the mailbox), a note that any other SMTP-capable provider works identically with no code change, and a concrete three-step post-activation verification checklist (real inbox delivery including spam-folder check, the admin Communications panel showing a real provider/status instead of "Logged," and SPF/DKIM alignment specifically for this send path, not assumed from the domain's general configuration).

---

## 3. Tests and validation

- **Backend:** full suite run — 258/258 passing (257 before this workstream, +1 new). Zero regressions.
- **Frontend:** 302/302 passing, unchanged. No frontend code was changed or needed — the Communications panel already displays whatever provider/status the backend reports; nothing about it assumes or depends on which provider is configured.
- The new test was itself caught and fixed once during development (an earlier iteration's server-side command handling had an unrelated bug in an early draft; the version above was verified passing before being considered complete).

---

## 4. What was not done, and why

- **Real SMTP credentials were not configured, and no real email was sent to a real external inbox.** This requires an actual external account (a real mailbox or a real third-party transactional-email service signup) that this coding session cannot create or authenticate with on its own. This is stated as a genuine, respected limitation, not glossed over — no placeholder credentials were invented, and no "sent successfully" claim was fabricated anywhere in code, tests, or documentation.
- **No new project dependency was added** (e.g. `aiosmtpd`) — the wire-level test uses only the Python standard library, consistent with `SmtpEmailProvider`'s own stated design goal of using only `smtplib`/`email.mime`.
- **The underlying tracked gap (`CURRENT_SPRINT.md` item 22) is not marked fully closed** — it's updated to reflect the new, stronger verification, but the credential-missing status remains honestly stated.

---

## 5. Commit status

Backend: `tests/test_email_provider.py` changes complete and tested. Frontend: governance docs (`CURRENT_SPRINT.md`, `PROJECT_STATE.md`, `ARCHITECTURE_DECISIONS.md` ADR-029, `CHANGELOG.md`, `docs/operations/PRODUCTION_RUNBOOK.md` §9) updated, plus this report. Both repos ready to commit locally. **Not pushed** — awaiting approval, per instruction ("await approval before push").
