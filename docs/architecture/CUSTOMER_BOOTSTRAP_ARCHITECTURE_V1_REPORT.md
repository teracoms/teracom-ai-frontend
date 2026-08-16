# Customer Bootstrap Architecture V1 — Report

**Date:** 2026-08-16 · **Type:** Documentation-only change · **Scope:** `docs/architecture/`

---

## 1. Task

Deep-dive [[digital-workforce-platform-v1]] §18's bootstrap-gap finding into a complete Day-0 onboarding architecture, answering ten named questions (discover → sign up → create organisation → become admin → obtain a licence → create first users → create first workers → assign knowledge → configure memory → operate the workforce), with explicit gaps, required backend changes, required frontend changes, and required database changes. Documentation only — no frontend, backend, or code changes.

## 2. Files created

| File | Purpose |
|---|---|
| `docs/architecture/CUSTOMER_BOOTSTRAP_ARCHITECTURE_V1.md` | The ten-stage bootstrap architecture, plus consolidated gaps/backend/frontend/database change tables, a narrative sequence, security considerations, open decisions, and recommendations |
| `docs/architecture/CUSTOMER_BOOTSTRAP_ARCHITECTURE_V1_REPORT.md` | This report |

## 3. Files reviewed first-hand

[[digital-workforce-platform-v1]] and [[licensing-service-architecture-v1]] (both already produced this session, re-read for this task), [[foundation-workforce-catalogue-v2]] and the 11 individual `docs/workforce/*.md` files. New first-hand backend review for this task specifically: `api/auth.py`, `auth/dependencies.py`, `auth/organisation.py`, `auth/rate_limit.py`, `models/user.py`, `models/organisation.py`, `schemas/user.py`, `schemas/organisation.py` — the complete current authentication and organisation/user-creation implementation, none of which had been read line-by-line before this task (prior work had cited `auth/roles.py` and `auth/security.py` only).

## 4. Key findings new to this task

- **`UserCreate`'s `organisation_id` field is dead input.** The schema accepts it, but `api/users.py`'s handler ignores the payload value and uses the authenticated caller's own `organisation_id` instead. This is actually a *correct* defensive behaviour (a caller can't create a user in someone else's organisation by lying in the request body) but it's undocumented and the schema is misleading as written — worth a note for whoever eventually touches this endpoint again.
- **Two unhandled database-integrity error paths exist today**, confirmed by reading both handlers directly: a duplicate `organisations.slug` and a duplicate `users.email` both hit a unique constraint with no `try/except` around the insert in either `api/organisations.py` or `api/users.py` — meaning both currently surface as a raw 500, not a friendly conflict response. This becomes more exposed the moment either path is reachable by a public signup flow.
- **`organisations` has no `created_at`/`updated_at` at all** (confirmed directly from `models/organisation.py`, three columns total: `id`, `name`, `slug`) — the same absence [[licensing-service-architecture-v1]] §3 already noted for tables generally, now confirmed specifically for the one table this document's design touches most.
- **No password-reset endpoint exists anywhere** in `api/auth.py` (only `/login` and `/me`) — a pre-existing gap, not created by this design, but one this document's signup flow makes more urgent, since self-service accounts have no recovery path today if a password is lost.
- **Zero email-sending capability anywhere in the backend** (confirmed by a direct search for SMTP/SendGrid/SES/mailer patterns, none found) — this single gap blocks email verification, licence-approval notification, invitation, and password reset simultaneously, which is why the document's recommendations (§18 there) treat it as one shared prerequisite rather than four separate small gaps.
- **The self-service-signup vs. human-approval-licensing tension.** Neither [[digital-workforce-platform-v1]] nor [[licensing-service-architecture-v1]] previously stated this explicitly: a signup flow that completes immediately is in real tension with [[licensing-model-v1]] §9's decided "no licensing action is fully automated" principle. This document's proposed resolution — decouple account creation from licence issuance via a new `pending_licence` organisation status — is offered as a design reconciling both, not a re-litigation of §9's decided principle.

## 5. Structural decisions

- **The ten requested questions are the document's backbone (§1–§10)**, each carrying its own BUILT/OPEN/PROPOSED content, rather than answered narratively across a differently-organised document — this keeps the document directly checkable against the task's own numbered list.
- **Four consolidated tables (§11–§14)** — Gaps, Backend Changes, Frontend Changes, Database Changes — pull every finding from §1–§10 into one place each, per the task's explicit four "Document..." requirements, rather than leaving a reader to re-derive them by scanning all ten stages.
- **§15's narrative sequence is deliberately short and cross-referenced**, not a restatement of §1–§10's content — it exists to answer "what does this look like end to end" in one read, with every step pointing back to the section that justifies it.
- **§16 (Security) is a distinct section, not folded into the gaps table**, because the signup endpoint's authorization carve-out is a design property worth a reviewer's dedicated attention (per the endpoint's own description in §2/§0), not a bug-shaped "gap" alongside missing timestamp columns.
- **Stages already fully covered elsewhere (7, 8) are kept short and link outward**, per [[documentation-standards]] §6, rather than re-explaining Package 3/Package 4 detail already documented in [[digital-workforce-platform-v1]] and [[frontend-architecture]].
- **No resolution of the pending-licence-access question (Open Decision #1)** — the narrative sequence in §15 states plainly that it assumes the more permissive reading only because the sequence needs *some* concrete assumption to be written at all, and flags this as reversible, not as this document taking a side.

## 6. Verification

- Every claim about `require_role("admin")` gating, the `organisation_id` handling in `UserCreate`, the missing timestamp columns, and the absent password-reset/email capability was checked against the actual file content read in this task, not carried over from the prior [[digital-workforce-platform-v1]] task's summary-level citation of `auth/roles.py` alone.
- The "no signup route" and "no email capability" claims were each verified by a direct repository search (not repeated from memory of the prior task's equivalent search), confirming both still hold.
- Every `[[wikilink]]` target was checked against a document that exists on disk, including the three other architecture documents this session already produced.
- The security-considerations section's claim about the login-query-parameter quirk was checked against its existing citations in [[security-standards]] and `docs/backend/BACKEND_STATUS.md` rather than re-asserted as a new finding, since it was already documented before this task.

## 7. Not done (explicitly out of scope)

- No resolution of any of §17's seven open decisions in the main document — each is a named worker's or the project owner's call.
- No ADR added, no `docs/governance/ROADMAP.md` update sequencing this work, no `docs/standards/DOCUMENTATION_STANDARDS.md` update — consistent with this session's established precedent of doing only what a task explicitly names; flagged as reasonable follow-ups, not executed.
- No frontend or backend code was created, edited, or run; no build/lint/test validation was performed, consistent with a documentation-only task.
