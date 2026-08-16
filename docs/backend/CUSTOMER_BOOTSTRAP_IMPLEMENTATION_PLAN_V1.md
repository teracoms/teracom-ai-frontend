# Customer Bootstrap Implementation Plan V1

**Status:** Draft V1, 2026-08-16. A build-ready implementation plan for [[customer-bootstrap-architecture-v1]], sequenced against [[licensing-service-architecture-v1]]'s own prerequisites. **This document does not implement code** — it identifies exactly what must be built, in what order, and why, so that implementation can begin from a plan rather than from the architecture document's open-ended "PROPOSED, for review" framing.

**Sourcing:** First-hand. In addition to [[customer-bootstrap-architecture-v1]] and [[licensing-service-architecture-v1]] (both re-read in full for this task), this plan adds direct review of `teracom-ai-backend`'s `main.py` (router-registration pattern) and `config.py` (the `_require()`/env-var convention and existing rate-limit settings) to ground the concrete implementation steps below in the actual current wiring, not an assumed one.

**Naming note:** the "Implementation Package" numbers below (1–8) are this document's own sequencing and are **distinct from** the existing `docs/frontend/IMPLEMENTATION_REPORTS/` Package 1–9 numbering (Workers, Knowledge, Chat, …) already used elsewhere in this knowledge base — a deliberate choice to avoid implying this work slots into that existing sequence at a specific number before [[project-manager-worker]] has actually sequenced it into [[roadmap]].

Per [[documentation-standards]] §2: this document distinguishes **PLANNED** (this document commits to a concrete build step, with no remaining open business question blocking it) from **BLOCKED** (a concrete open question, cited to its source section in one of the two governing documents, must be resolved before this step can be built as more than a stub).

---

## 1. Required database changes

All changes below are **new tables/columns only** — consistent with both governing documents, no existing table is altered destructively and no existing table is dropped.

| Change | Table | Status | Source |
|---|---|---|---|
| Add `status`, `created_at`, `updated_at` | `organisations` | PLANNED | [[customer-bootstrap-architecture-v1]] §3 |
| Add `created_at`, `updated_at` | `users` | PLANNED | [[customer-bootstrap-architecture-v1]] §4 |
| Add `is_owner` (boolean, nullable → default false) | `users` | BLOCKED — Open Decision #5 | [[customer-bootstrap-architecture-v1]] §4, §17 |
| New table: `password_reset_tokens` (`id`, `user_id` FK, `token_hash`, `expires_at`, `used_at`) | new | PLANNED | [[customer-bootstrap-architecture-v1]] §6 |
| New table: `user_invitations` (`id`, `organisation_id` FK, `email`, `role`, `invited_by_user_id` FK, `token_hash`, `expires_at`, `accepted_at`) | new | BLOCKED — Open Decision #6 (is invitation in scope for Day-0 at all) | [[customer-bootstrap-architecture-v1]] §6, §17 |
| New table: `licence_requests` (minimal subset — see §6 of this plan) | new | PLANNED, coordinated with the Licensing Service track | [[licensing-service-architecture-v1]] §10 |
| New table: `staff_users` (minimal subset — see §6) | new | PLANNED, coordinated with the Licensing Service track | [[licensing-service-architecture-v1]] §11.1 |

**A note on tokens:** every token table above stores `token_hash`, not the raw token — the raw value is returned once (in the email/response) and never persisted, mirroring the existing `password_hash` convention (§8).

**Explicitly out of scope for this plan:** the remaining six Licensing Service tables (`licences`, `subscriptions`, `entitlements`, `worker_packs`, `hardware_fingerprints`, `licensing_audit_log`) — those belong to the full Licensing Service build-out ([[licensing-service-architecture-v1]] §24.2) and are not required to unblock Day-0 signup itself. See §6 below for exactly where the line is drawn and why.

---

## 2. Required API endpoints

| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/signup` | `POST` | None (deliberate carve-out, §3, §8) | PLANNED |
| `/auth/password-reset/request` | `POST` | None | PLANNED |
| `/auth/password-reset/confirm` | `POST` | None (token-authenticated) | PLANNED |
| `/users/invite` | `POST` | Existing `require_role("admin")` | BLOCKED — Open Decision #6 |
| `/invitations/{token}/accept` | `POST` | None (token-authenticated) | BLOCKED — Open Decision #6 |
| `/staff/licence-requests` (minimal: list + approve only) | `GET`, `POST /{id}/decision` | New `staff_users` auth (§3) | PLANNED, minimal subset — see §6 |
| `/licensing/status` | `GET` | Existing customer JWT | BLOCKED — depends on full Licensing Service generation pipeline ([[licensing-service-architecture-v1]] §12); this plan's Package 7 (§10) stubs a minimal version returning `pending_licence`/`active` only |

Every new endpoint is registered in `main.py` following the existing pattern (a dedicated `api/<name>.py` module, `router = APIRouter(prefix=...)`, imported and `include_router`'d alongside the other 39+ existing routers) — no new registration mechanism is introduced.

---

## 3. Required authentication changes

- **A single, deliberate, narrowly-scoped exception to `require_role("admin")`**: `POST /signup` is the only endpoint in this entire plan with no `Depends(require_role(...))` guard. Nothing else in this plan relaxes an existing gate.
- **Auto-login on signup:** `POST /signup` calls the existing `create_access_token()` (`auth/security.py`) for the newly-created admin user and returns it exactly as `POST /auth/login` does today, so the frontend's existing session-cookie-setting flow (`app/api/auth/login/route.js`'s pattern) can be reused for a new `app/api/auth/signup/route.js` with no new session mechanism.
- **New, short-lived, single-use tokens** (distinct from the JWT access token) for password reset (and invitation, if adopted): random (`secrets.token_urlsafe`, not a predictable ID), hashed at rest (§1), expiring (e.g. 1 hour for password reset, 7 days for invitation — exact values BLOCKED pending a project-owner call, not decided by this plan), and checked for `used_at IS NULL` before being honoured.
- **A new, parallel `staff_users` authentication surface** ([[licensing-service-architecture-v1]] §11.1, §22.4) — this plan's Package 6 (§10) builds only the minimal slice needed to unblock the first `initial_issuance` approval (login + one decision endpoint), not the full staff console; the complete staff-facing product is the Licensing Service track's own scope, not this plan's.
- **Rate limiting generalised, not duplicated:** `auth/rate_limit.py`'s `LoginRateLimiter` is a per-(IP, email) sliding-window limiter, already process-local by design (documented in its own docstring). This plan proposes extracting its core sliding-window logic into a reusable limiter class parameterised by a key function, then instantiating it a second time for `/signup` (keyed by IP alone, since there's no "existing account" to key against yet) and a third time for `/auth/password-reset/request` (keyed by email, to prevent reset-token enumeration/spam) — reusing the existing `config.py` `_require()`/env-var convention for each limiter's thresholds, not inventing a new configuration pattern.

---

## 4. Required frontend pages

| Page | Route | Auth | Status |
|---|---|---|---|
| Signup wizard | `/signup` | Public, outside `app/portal/(protected)/**` | PLANNED |
| Password reset request | `/portal/password-reset` (or a public equivalent — exact placement BLOCKED, minor) | Public | PLANNED |
| Password reset confirm | `/portal/password-reset/[token]` | Public, token-authenticated | PLANNED |
| Invitation accept | `/invitations/[token]` | Public, token-authenticated | BLOCKED — Open Decision #6 |
| Dashboard pending-licence banner | Addition to existing `/portal/dashboard` | Authenticated | PLANNED |
| BFF proxy routes for each of the above | `app/api/auth/signup/route.js`, `app/api/auth/password-reset/*/route.js`, etc. | Server-only, per ADR-002 | PLANNED, one per public page above |

Every new public page gets its own route segment **outside** `app/portal/(protected)/**`'s existing layout guard, since that layout's server-side session check (per [[frontend-architecture]] §C's protected-route pattern) would otherwise redirect an unauthenticated signup/reset visitor straight to `/portal/login` — a new, minimal public layout (or no shared layout at all, matching how `/store`/`/checkout/**` already sit outside `/portal/**`) is required, not a new case inside the existing protected layout.

---

## 5. Required email flows

| Flow | Trigger | Status |
|---|---|---|
| Signup confirmation / email verification | `POST /signup` | BLOCKED — Open Decision #3 (is verification mandatory) |
| Licence request submitted (customer-facing "we received it") | `POST /signup`'s `licence_requests` row creation | PLANNED (content), BLOCKED (delivery — depends on provider choice, §7) |
| Licence approved (customer-facing) | Staff approval decision (§6) | PLANNED (content), same delivery dependency |
| Password reset | `POST /auth/password-reset/request` | PLANNED (content), same delivery dependency |
| Invitation | `POST /users/invite` | BLOCKED — Open Decision #6 |

**The one shared blocking dependency across every row above:** no email-send integration exists in `teracom-ai-backend` today (confirmed by direct search, [[customer-bootstrap-architecture-v1]] §0). This plan's Package 3 (§10) treats "choose and wire one transactional email provider" as a single, standalone unit of work precisely because it unblocks all five flows at once — building it once, not once per flow, is the whole point of sequencing it as its own package rather than embedding it piecemeal into each endpoint's implementation.

**Interim mitigation, PLANNED for the very first release only:** if the email integration (Package 3) is not ready before signup itself needs to ship, password-reset and licence-request-submitted confirmations can degrade to "shown on-screen, not emailed" (the token/link is displayed directly to the logged-in user rather than sent) — a real UX downgrade, but one that keeps the rest of the bootstrap flow functional rather than blocking the entire plan on the email provider decision. This is offered as a sequencing safety valve, not a recommendation to skip email long-term.

---

## 6. Required licensing integration

Full detail in [[licensing-service-architecture-v1]] — this plan integrates with it at exactly three points, and goes no further:

1. **`POST /signup` creates one `licence_requests` row** (`request_type = initial_issuance`) in the same transaction as the organisation/user rows ([[customer-bootstrap-architecture-v1]] §5). This plan needs the `licence_requests` table (§1) to exist, but **only the columns [[licensing-service-architecture-v1]] §10 already specifies** — no schema divergence is introduced here.
2. **A minimal `staff_users` + approval endpoint** ([[licensing-service-architecture-v1]] §11.1–§11.2) is built as part of this plan (Package 6, §10) specifically so the very first customer's `initial_issuance` request has somewhere to go, **without waiting for the full Licensing Service product** (generation pipeline, signed licence files, hardware fingerprints, entitlement enforcement) to be complete. This plan's minimal approval endpoint sets `organisations.status` from `pending_licence` to `active` directly on approval — it does **not** generate a signed licence file (§12 of that document); that remains the full Licensing Service track's own deliverable, built on top of this minimal foundation rather than duplicated by it.
3. **`GET /licensing/status` is stubbed, not fully built**, returning only `{status: "pending_licence" | "active"}` sourced from `organisations.status` — the richer response ([[licensing-service-architecture-v1]] §23.1: tier, entitlements, expiry) is BLOCKED on that document's own §24.5 prerequisites and is explicitly not this plan's deliverable.

**Why split it this way:** [[customer-bootstrap-architecture-v1]] §18's own recommendation #4 says to sequence this work "alongside, not after" the Licensing Service prerequisites. This plan takes that literally — it builds the smallest possible slice of the licensing schema and staff-approval surface needed to let Day-0 customers move from `pending_licence` to `active`, and leaves the full commercial/technical licence-file machinery to proceed on its own track without either blocking the other.

---

## 7. Required migration strategy

1. **Adopt Alembic** ([[licensing-service-architecture-v1]] §24.1 — the single hard prerequisite both documents agree on). Concretely: `alembic init`, configure it against the existing `database/connection.py`'s engine, then generate a **baseline migration** that represents the current schema exactly as `create_tables.py` produces it today — this baseline does not change anything, it exists so every migration after it has a known starting point and a rollback path.
2. **One migration per Implementation Package below (§9), not one giant migration.** Each package's schema change (§1) ships as its own reversible migration, so a problem discovered after Package 2 ships doesn't require rolling back Package 4's unrelated change too.
3. **Order, matching the Implementation Package sequence:**
   - Migration 1: baseline (no-op).
   - Migration 2: `organisations.status`/timestamps, `users` timestamps.
   - Migration 3: `password_reset_tokens`.
   - Migration 4: `licence_requests`, `staff_users` (minimal columns, §6).
   - Migration 5 (BLOCKED, only if Open Decision #6 resolves yes): `user_invitations`.
4. **`create_tables.py` is retired as the schema-management mechanism** once Alembic is adopted — it remains harmless for a fresh empty database (it would simply create nothing new once Alembic-managed tables already exist) but should no longer be treated as how schema changes reach a database with existing data, per [[licensing-service-architecture-v1]] §24.1's own finding that it has no alter/rollback capability at all.

---

## 8. Security considerations

- **The `POST /signup` authorization carve-out is the one item in this entire plan that most needs a dedicated [[cybersecurity-worker]] review before merge**, not just before ship — it is a deliberate, permanent exception in an otherwise-consistent `require_role()` model, and the risk is a future contributor copying its "no guard" shape onto an endpoint that should have one.
- **Token hygiene:** every new token (password reset, invitation) is generated with a cryptographically random source (`secrets.token_urlsafe`), stored only as a hash, single-use (`used_at` checked and set atomically with the action it authorises), and time-limited.
- **No user enumeration via password reset:** `POST /auth/password-reset/request` must return an identical response whether or not the submitted email matches an existing account — this is a concrete implementation requirement, not an open question, since the alternative (a different response for "email not found") turns the endpoint into an account-enumeration oracle.
- **Signup duplicate-email handling is a real trade-off, not just a bug fix:** returning "that email is already registered" is more usable but confirms an email's existence to an anonymous caller; returning a generic "check your email to continue" regardless of outcome is more private but a worse experience for a genuine user who mistyped. This plan does not resolve the trade-off — it flags that whichever is chosen should be a deliberate choice made alongside the duplicate-email fix in Package 2 (§9), not an accidental side effect of how the fix happens to be coded.
- **Rate limiting is required on `/signup` and both password-reset endpoints from first ship**, not added later — an unauthenticated, database-writing endpoint and an email-triggering endpoint are exactly the two shapes existing abuse controls (`LoginRateLimiter`) were built for; shipping without the generalised limiter (§3) recreates a gap this codebase already solved once for login.
- **Multi-tenant isolation is preserved only if `staff_users` never gains an `organisation_id`** and staff-only endpoints never accept a customer-session JWT — restated from [[licensing-service-architecture-v1]] §22.4/§22.6 because this plan is the first thing that actually builds a `staff_users` row, not just proposes one.

---

## 9. Testing strategy

Per [[worker-operating-standards]] §5 / [[development-standards]] §7's existing validation bar (build/lint/unit tests passing, plus an end-to-end smoke test against a live backend, test data cleaned up afterward) — applied to this plan's specific new surfaces:

| Scenario | Package | Type |
|---|---|---|
| Signup happy path → organisation + admin user + licence request created, session issued | 2 | Smoke |
| Duplicate organisation name/slug → friendly conflict response, not a 500 | 2 | Unit + smoke |
| Duplicate email at signup → friendly conflict response (per chosen trade-off, §8) | 2 | Unit + smoke |
| Signup rate limit triggers after N attempts from one IP | 2 | Unit |
| Malformed signup payload → 400, not a 500 | 2 | Unit |
| Password reset: request → token issued → confirm → old password invalid, new password works | 4 | Smoke |
| Password reset: expired token rejected; used token rejected on replay | 4 | Unit |
| Password reset request for a non-existent email → identical response to an existing one (§8) | 4 | Unit |
| Staff login (new `staff_users` plane) is fully separate from customer login — a customer JWT is rejected by the staff-only endpoint and vice versa | 6 | Smoke, security-focused — [[cybersecurity-worker]] should own or co-own this one specifically |
| Staff approves an `initial_issuance` request → organisation status flips `pending_licence` → `active` | 6 | Smoke |
| `GET /licensing/status` reflects the correct stub value at each stage above | 6 | Smoke |
| A `pending_licence` organisation's access scope matches whatever Open Decision #1 resolves to, once resolved | 7 (or wherever #1 lands) | Smoke, blocked until #1 is decided |
| Multi-tenant isolation: a `staff_users` credential cannot read/write any customer-org-scoped endpoint; a customer JWT cannot reach any `/staff/*` endpoint | 6 | Security-focused |

[[qa-worker]] is the role accountable for confirming these gates are actually met before any package here is marked complete in [[project-state]], per its own catalogue entry.

---

## 10. Recommended implementation packages and build order

| # | Package | Contains | Depends on | Status |
|---|---|---|---|---|
| 1 | **Migration Foundation** | Adopt Alembic; baseline migration (§7) | Nothing | PLANNED — **build this first, see below** |
| 2 | **Bootstrap Schema + Signup API** | `organisations`/`users` column additions; `POST /signup`; slug/email collision fixes; signup rate limiter | Package 1 | PLANNED |
| 3 | **Email Integration** | Provider decision + send layer, wired to licence-submitted/approved and password-reset content | Package 1 (for any token tables it writes to) | PLANNED, provider choice BLOCKED (§17 of the architecture doc) |
| 4 | **Signup Frontend + Password Reset** | `/signup` page, BFF proxy, dashboard pending-licence banner, password-reset pages/endpoints | Packages 1–2 (reset tokens need Package 1's migration); degrades gracefully without Package 3 (§5's interim mitigation) | PLANNED |
| 5 | **Invitations** | `user_invitations` table, invite/accept endpoints and pages | Packages 1, 3; BLOCKED on Open Decision #6 | BLOCKED |
| 6 | **Minimal Staff Approval** | `staff_users` (minimal), `licence_requests` (minimal), one approval endpoint, organisation status transition | Package 1; coordinates with, but does not wait for, the full Licensing Service track | PLANNED |
| 7 | **Licensing Status Stub** | `GET /licensing/status` (stub), dashboard banner goes from static to real | Package 6 | PLANNED |
| 8 | **Pending-Licence Access Policy** | Whatever gating Open Decision #1 resolves to | Package 6; BLOCKED on Open Decision #1 | BLOCKED |

### Which package should be built first

**Package 1 — Migration Foundation.** This is the least glamorous and least product-visible package in this plan, and it is also the only one with zero open questions blocking it and zero dependencies of its own — every other package in this table either directly depends on it (2, 4, 6, 7) or transitively does (3, 5, 8). Both governing documents independently name the same prerequisite ([[customer-bootstrap-architecture-v1]] §12, [[licensing-service-architecture-v1]] §24.1) — this plan does not discover a new reason to build it first, it confirms that the existing consensus survives contact with a concrete package-sequencing exercise. Shipping any schema change in this plan (or the separate Licensing Service track) onto a database that already has real rows, without Alembic in place first, has no rollback path if something needs correcting — a risk with real customer data attached from the moment Package 2 ships, not a theoretical one.

**Immediately after Package 1**, this plan recommends **Package 2 (Bootstrap Schema + Signup API) and Package 6 (Minimal Staff Approval) in parallel**, not strictly sequentially — they touch different tables and different teams' natural ownership ([[software-developer-worker]] for Package 2, coordinated with [[licensing-compliance-worker]]/[[cybersecurity-worker]] for Package 6's new auth plane), and Package 2's signup flow is only genuinely useful once Package 6 exists to move a customer out of `pending_licence` — building them together, rather than one fully before the other, avoids a customer-visible signup flow existing for a period with no possible path to `active`.
