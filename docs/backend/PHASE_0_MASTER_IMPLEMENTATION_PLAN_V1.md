# Phase 0 Master Implementation Plan

**Status:** Build-ready implementation plan, 2026-08-16. Combines five items from Phase 0 of [[runtime-and-intelligence-cloud-implementation-roadmap-v1]] into one execution stream: **Bootstrap Package 2** (already implemented), **Bootstrap Package 3** (Email Integration), and the merged **Licensing / Entitlements / Activation** foundation identified in [[teracom-intelligence-cloud-implementation-roadmap-v1]] §1–§3 and [[customer-bootstrap-implementation-plan-v1]] §6/§10 as Bootstrap Package 6. Documentation only. No code, no implementation.

**Placement note:** filed under `docs/backend/`, alongside [[customer-bootstrap-implementation-plan-v1]] and the two existing package implementation reports, since this is an execution-level plan for backend work, not a strategy document — consistent with that document's own location.

**How the five fields per item are used:** **Purpose** and **Dependencies** state what the item is for and what blocks it, citing the source document. **Backend/Frontend/Database/Intelligence Cloud changes** state concretely what gets built, or explicitly "none," rather than leaving a category silently blank. **Validation requirements** state the specific test scenarios this item needs before [[qa-worker]] would sign it off, per [[worker-operating-standards]] §5's existing bar.

---

## 1. Bootstrap Package 2 — Customer Signup & Organisation Creation

**Status: already implemented and validated.** Included here for completeness of the unified stream, not as outstanding work — see [[customer-bootstrap-package-2-implementation-report]] for full detail.

- **Purpose:** the self-service bootstrap mechanism — `POST /signup` creates a brand-new organisation (`status = "pending_licence"`) and its first admin user in one transaction, solving the chicken-and-egg problem that every other organisation/user-creation endpoint requires an existing admin.
- **Backend changes (done):** `api/signup.py`; slug auto-generation with collision retry; duplicate-email/duplicate-slug fixes on the pre-existing `POST /organisations/`/`POST /users/` endpoints; a generalised `SlidingWindowRateLimiter` plus a new `SignupRateLimiter`.
- **Frontend changes (done):** none — Package 2 was scoped backend-only; the signup *page* is Bootstrap Package 4, explicitly outside this combined stream.
- **Database changes (done):** `organisations.status`/`created_at`/`updated_at`, `users.created_at`/`updated_at` (Alembic revision `4cf27ac68b82`).
- **Intelligence Cloud changes:** none — Package 2 predates Intelligence Cloud entirely. Its only forward-looking artifact is `organisations.status = "pending_licence"`, which the Licensing item below (§3) is the first thing to actually act on.
- **Dependencies:** Bootstrap Package 1 (Alembic foundation) — satisfied.
- **Validation requirements (met):** build, 8 passing tests, and live API verification against a running server, all recorded in the implementation report; no further validation is required by this plan.

## 2. Bootstrap Package 3 — Email Integration

- **Purpose:** the one shared email-sending capability behind every notification this stream and its near-term successors need — licence-request-submitted confirmation, licence-approved notification, and (in a later, separate package) password reset. [[customer-bootstrap-implementation-plan-v1]] §5 treats this as a single unit of work precisely because building it once unblocks several flows rather than one.
- **Backend changes:** a provider decision (transactional email API vs. SMTP — **OPEN**, not decided by this plan) and one send-wrapper module; a hook fired from `POST /signup` (optional verification email — itself gated on [[customer-bootstrap-architecture-v1]] §17 Open Decision #3, whether verification is mandatory); hooks fired from the Licensing item's request-submitted and decision events (§3 below).
- **Frontend changes:** none in this package — the password-reset *pages* are Bootstrap Package 4, outside this combined stream.
- **Database changes:** none required for the core send capability. If delivery auditing is wanted, an `email_log` table (`recipient`, `template`, `sent_at`, `provider_status`) is a reasonable addition, but this plan does not treat it as required for MVP.
- **Intelligence Cloud changes:** none directly. This package's licence-related templates (request-submitted, approved) are only meaningful once the Licensing item below produces those events — a **soft, sequencing dependency**, not a blocking one, since the core send capability and the signup-verification template need nothing from Licensing at all.
- **Dependencies:** none blocking the core capability. The two licence-related templates specifically need Licensing's request/decision events to exist to be testable end to end (not to be *written*).
- **Validation requirements:** unit tests for the send-wrapper against a mocked provider; one live smoke test sending an actual test email to a disposable address, confirming provider-accepted delivery, with no persistent customer data left behind afterward; once Licensing (§3) exists, an end-to-end test confirming the request-submitted and approved templates actually fire on those events.

## 3. Licensing

- **Purpose:** the mechanism that turns a commercial entitlement snapshot into a signed, offline-verifiable artifact, gated by mandatory human approval for every entitlement-changing action ([[licensing-model-v1]] §9). This is the first real Teracom Intelligence Cloud service, per [[teracom-intelligence-cloud-strategy-v1]] §10, and the item every other new item in this plan depends on.
- **Backend changes:** a new `staff_users` authentication plane (`POST /staff/login`, reusing the existing `hash_password`/bcrypt scheme, a distinct JWT `aud` claim so a customer token can never be mistaken for a staff one — [[licensing-service-architecture-v1]] §22.4); the `licence_requests` state machine (`submitted → under_review → approved/rejected → issued`); `POST /licensing/requests` and `GET /licensing/requests` (customer-facing); `POST /staff/licence-requests/{id}/decision` (staff-facing); the Licence Generation Workflow (compute entitlement snapshot → assemble JWS payload → sign with the asymmetric private key → write the `licences` row); a local licence-validation module — the first real occupant of `teracom-ai-backend`'s currently-empty `middleware/` directory.
- **Frontend changes:** none in this package. The existing Billing & Licensing preview UI (built in the earlier frontend Package 9) remains on illustrative data — wiring it to real data is [[runtime-and-intelligence-cloud-implementation-roadmap-v1]]'s Phase 1, not this plan.
- **Database changes:** new tables `staff_users`, `licence_requests`, `licences`, `licensing_audit_log` (append-only).
- **Intelligence Cloud changes:** this package **is** the first Intelligence Cloud service — signing, issuance, and staff approval never run on customer infrastructure under any hosting model ([[teracom-intelligence-cloud-strategy-v1]] §2). It also establishes the entitlement-gating pattern (§4 below) that every future Intelligence Cloud endpoint will reuse.
- **Dependencies:** Alembic (satisfied); **ratification of the asymmetric signing algorithm (Ed25519 or RS256 — proposed, not yet ratified, [[licensing-service-architecture-v1]] §13.2)**, a blocking prerequisite decision, not an implementation detail this plan can resolve unilaterally; a dependency-manifest entry for whichever cryptography library is chosen; Bootstrap Package 2 (satisfied — `organisations.status = "pending_licence"` is the field this reacts to).
- **Validation requirements:** unit tests for every `licence_requests` state transition; signature-verification tests (valid, tampered, expired-key-version, unknown-key-version); an end-to-end smoke test covering the full path — signup → `pending_licence` organisation → licence request submitted → staff approval → licence issued → local validation succeeds → organisation status flips to `active`; and a **security-focused isolation test, called out explicitly per [[core-runtime-exposure-assessment-v1]] §9**, confirming a customer JWT is rejected by every `/staff/*` endpoint and a staff JWT is rejected by every customer-facing endpoint.

## 4. Entitlements

- **Purpose:** the source of commercial truth — tier, worker/user/organisation limits, worker-pack additions — kept distinct from Licensing's signed-artifact mechanism, per [[teracom-intelligence-cloud-strategy-v1]] §12: Entitlements own "what's true now," Licensing owns "what's provably true to a deployment that can't ask."
- **Backend changes:** the `entitlements` CRUD layer (one row per licence); the worker-pack recompute formula (`tier_base_workers + Σ(pack_size × quantity)`); the **entitlement-check function** that Intelligence Cloud endpoints will call to gate access by tier — built now, even though few Intelligence Cloud endpoints exist yet, specifically so the gating pattern is established once rather than retrofitted later.
- **Frontend changes:** none in this package.
- **Database changes:** new table `entitlements` (`licence_id` FK, `worker_limit`, `user_limit`, `organisation_limit`, `hosting_model`).
- **Intelligence Cloud changes:** delivers the shared entitlement-gating function every later Intelligence Cloud service ([[teracom-intelligence-cloud-implementation-roadmap-v1]] §6–§8) will call — the gate exists before there is a second service to protect with it.
- **Dependencies:** Licensing (§3) — `entitlements.licence_id` is a foreign key into the `licences` table that item creates. Resolution of the organisation-cardinality question ([[licensing-service-architecture-v1]] §4.1/§8) blocks a *final* schema only for Enterprise/Platinum; Starter (a fixed single organisation) has no such ambiguity and is not blocked.
- **Validation requirements:** unit tests for the worker-pack recompute formula; a test confirming the entitlement-check function correctly allows/denies a call based on tier. **Explicitly out of scope for this item's validation:** enforcing the worker-limit-blocks-creation policy inside Core Runtime's `POST /workers/` — that is a separate, already-tracked gap ([[licensing-service-architecture-v1]] §5) with zero implementation anywhere, and this plan does not fold it into Entitlements' validation bar.

## 5. Activation

- **Purpose:** binds a specific deployment's hardware to an issued licence, so a valid licence file cannot simply be copied onto a second, unauthorised deployment.
- **Backend changes:** hardware-fingerprint capture and combination logic (VM UUID + Disk UUID + TPM-where-available → a single hashed value); the initial-activation step wired as the final stage of Licensing's Licence Generation Workflow; the schema/field support for a future `hardware_rebind` request type (the re-binding *workflow* itself is deferred past this plan's scope, per [[teracom-intelligence-cloud-implementation-roadmap-v1]] §3, but the schema should exist now to avoid a later migration).
- **Frontend changes:** none in this package.
- **Database changes:** new table `hardware_fingerprints`; a nullable `licences.hardware_fingerprint_id` foreign key added to the `licences` table created under Licensing (§3).
- **Intelligence Cloud changes:** split by design — fingerprint *capture* runs inside Core Runtime (it must work with zero connectivity, per the offline-capability requirement) and is transmitted as part of a licence request payload; the binding *authority and record* live in Teracom Intelligence Cloud (§3's Licensing service), consistent with [[model-c-revised-architecture-v1]] §2's Core-Runtime/TIC split applied to this specific capability.
- **Dependencies:** Licensing (§3) — activation shares the `licences`/`licence_requests` pipeline and approval gate. **Ratification of the fingerprint-combination algorithm and hardware-change tolerance rule** — both already have a proposed default in [[licensing-service-architecture-v1]] §9.1 (SHA-256 combination) and §9.2 (match on 2 of 3 components), so this is a review-and-ratify step, not new design work, but it is still a prerequisite this plan does not resolve unilaterally.
- **Validation requirements:** a unit test confirming the fingerprint-combination function is deterministic given identical inputs; a test confirming the 2-of-3 tolerance rule matches and rejects correctly at each boundary; activation's end-to-end coverage is folded into Licensing's own smoke test (§3) as its final step, not tested as a separate flow in isolation.

---

## 6. Exact build order

1. **Bootstrap Package 2 — already complete.** The baseline every other item in this stream builds on.
2. **Licensing (§3) — first new work.** Both Entitlements and Activation have a structural foreign-key dependency on the `licences`/`licence_requests` tables this item creates; nothing downstream can be finalised before it exists.
3. **Entitlements (§4) and Activation (§5) — in parallel, immediately after Licensing's core tables exist.** Neither depends on the other, only on Licensing — building them concurrently, by different people if available, is the correct use of the resulting parallelism, not a suggestion to sequence one after the other for no reason.
4. **Bootstrap Package 3 (§2 above) — starts in parallel with step 2, from day one**, since its core send-capability has no blocking dependency on anything else in this stream. Its two licence-related templates (request-submitted, approved) are wired and end-to-end tested last, once step 2's events exist to fire them from.

## 7. First code package to implement

**Licensing.** With Bootstrap Package 2 already complete, Licensing is the first *new* code package to start — not a close call, but the point where [[teracom-intelligence-cloud-strategy-v1]] §18, [[final-deployment-and-ip-protection-recommendation]] §5, [[teracom-intelligence-cloud-implementation-roadmap-v1]] §1–§3, and [[runtime-and-intelligence-cloud-implementation-roadmap-v1]]'s own "start immediately" recommendation all converge independently. It is the most mature design in the entire program, it structurally blocks both Entitlements and Activation, and it is where the signing-algorithm ratification this plan cannot resolve itself must be settled before implementation can proceed past its schema.

**Bootstrap Package 3's core send-capability may start immediately alongside it**, on an independent track — this is not a competing recommendation, only confirmation that starting Licensing does not require Package 3 to wait, nor does Licensing wait on it.
