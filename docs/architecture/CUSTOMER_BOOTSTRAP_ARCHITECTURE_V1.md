# Customer Bootstrap Architecture V1

**Status:** Draft V1, 2026-08-16. A deep-dive on [[digital-workforce-platform-v1]] §18's central finding — there is no unauthenticated path for a brand-new customer to obtain an organisation and an admin account — expanded here into a complete Day-0 architecture across all ten stages from discovery to an operating workforce.

**Sourcing:** First-hand throughout. In addition to the documents named below (each re-read in full or already reviewed first-hand this session), this document adds direct review of `teracom-ai-backend`'s `api/auth.py`, `auth/dependencies.py`, `auth/organisation.py`, `auth/rate_limit.py`, `models/user.py`, `models/organisation.py`, `schemas/user.py`, and `schemas/organisation.py` — the complete current authentication and organisation/user-creation implementation.

**Governing documents reviewed:** [[digital-workforce-platform-v1]] (§18 is this document's starting point), [[licensing-service-architecture-v1]] (the licence-issuance pipeline this document's §5 plugs into), [[foundation-workforce-catalogue-v2]] and the 11 individual `docs/workforce/*.md` files (who is accountable for which stage below).

**Focus:** *What is the first customer experience?* — not the technical mechanism in isolation, but what a real, brand-new visitor actually sees, does, and waits for, from the moment they hear about Teracom AI to the moment they have a working digital workforce.

Per [[documentation-standards]] §2, this document uses the same four-way labelling as [[digital-workforce-platform-v1]]: **BUILT** (verified first-hand today), **DECIDED** (ratified elsewhere, cited by section), **OPEN** (an unresolved question, existing or newly identified), **PROPOSED** (this document's own design, for review).

---

## 0. The one finding that shapes this entire document

**BUILT, confirmed by direct code review, not inference:**

- `POST /organisations/` (`api/organisations.py`) requires `require_role("admin")`.
- `POST /users/` (`api/users.py`) requires `require_role("admin")` and hard-codes the new user's `organisation_id` to `current_user["organisation_id"]` (the *caller's* organisation — the `organisation_id` field `UserCreate` accepts in its request body is silently ignored by the handler, which reads it from the authenticated admin's own token instead, not from the payload).
- `POST /auth/login` (`api/auth.py`) only ever authenticates an *existing* `users` row by email/password — there is nothing for a new customer to log into yet.
- No `register`/`signup` route exists anywhere in `teracom-ai-frontend` or `teracom-ai-backend` (confirmed by direct search of both repositories).
- No email-sending capability of any kind exists anywhere in `teracom-ai-backend` (confirmed by direct search — no SMTP, no SendGrid/SES, no mailer module).

**The consequence:** every one of the three existing authenticated write-paths that could plausibly create a new customer's first record requires an actor that, for a brand-new customer, does not yet exist. This is not a missing screen — a frontend "Sign Up" page has no backend endpoint to call. Every organisation and user in any environment of this project to date was created via direct database/script access, not through any path a real customer could go through themselves. This document's job is to design the missing piece: a bounded, deliberately-scoped exception to `require_role("admin")` that exists *only* for the first organisation/user of a brand-new customer, and everything downstream of it.

---

## 1. Discover Teracom AI

**BUILT ([[website-information-architecture-v2]] §2, cited not repeated):** the marketing site's flat 5-item nav (`What We Do`, `SecurityOS AI`, `Expertise`, `Store`, `Portal`) plus an `Open Store` CTA. `Portal` leads to `/portal/login` — a login page.

**OPEN ([[digital-workforce-platform-v1]] §16, restated):** there is no marketing-site call to action that leads a first-time visitor toward *creating* an account — only toward logging into one, or buying a store SKU. This is the top of the funnel this whole document exists to complete; it is not this document's job to redesign the marketing site (ADR-001 boundary, [[website-information-architecture-v2]] §2), only to note that Stage 2 below currently has no discoverable entry point at all.

**PROPOSED:** a "Start your workforce" (or equivalent) CTA, additive to the existing nav per ADR-001, pointing at Stage 2's new signup surface. This is a content/placement change, not a marketing-site redesign, consistent with how [[website-information-architecture-v2]] §6 already treats hero-copy changes as in-scope for [[content-production-worker]]/[[web-developer-worker]] without an ADR-001 exception.

---

## 2. Sign up

**BUILT:** nothing. No signup route, no signup form, no backend endpoint. This is the actual gap, not a UI omission — see §0.

**PROPOSED — new frontend surface:** `/signup` (public, unauthenticated route, outside `app/portal/(protected)/**`), a short wizard (per [[ux-vision]]'s Wizard-Second tier — a form is the fallback tier, and this has exactly the "several interdependent fields, not yet expressible as a single natural-language request" shape that tier 2 is for): step 1 collects the customer's name/email/password and organisation name; step 2 (§3) confirms the organisation identity; step 3 hands off to payment/licence request (§5).

**PROPOSED — new backend endpoint:** `POST /signup` (or `/bootstrap/signup`), deliberately **not** under the existing `/organisations/` or `/users/` prefixes, so it is never confused with the admin-gated endpoints it deliberately bypasses. Body: `{organisation_name, admin_first_name, admin_last_name, admin_email, admin_password}`. No `Depends(require_role(...))` — this is the one intentional, narrowly-scoped exception to that pattern anywhere in this design (§16 covers why this is safe to do deliberately and dangerous to do accidentally).

**OPEN — email verification:** should `admin_email` be verified before the account is usable? **This document recommends yes**, both as standard practice and because it is the cheapest available abuse control given no other gate exists at signup time (§16) — but building it requires a working email-send capability, which does not exist today (§0). This is listed as a required new integration, not assumed available.

**OPEN — CAPTCHA/bot protection:** not addressed by any reviewed document; flagged since an unauthenticated, org-creating endpoint is a natural spam/abuse target (§16).

---

## 3. Create an organisation

**BUILT:** `organisations` (`models/organisation.py`) has exactly three columns — `id`, `name`, `slug` (unique). No `status`, no `created_at`/`updated_at`, no plan/tier column (consistent with ADR-010's "no plan/seat data model" finding, now confirmed again first-hand). `slug` is caller-supplied in the existing `OrganisationCreate` schema, with **no server-side generation and no collision handling** — a duplicate `slug` today would raise an unhandled database integrity error (a 500, not a friendly "that name is taken" response), since `api/organisations.py`'s handler has no try/except around the insert.

**PROPOSED — database change:** add `status` (`pending_verification | pending_licence | active | suspended` — see §16 for why `pending_licence` is its own state, distinct from `active`) and `created_at`/`updated_at` to `organisations`. This mirrors [[licensing-service-architecture-v1]] §3's own observation that timestamp columns are absent from every existing table in this backend and treats it as a correction, not a new pattern.

**PROPOSED — slug handling:** the signup endpoint (§2) derives a candidate slug from `organisation_name` server-side (lowercase, hyphenated, per this knowledge base's own `[[kebab-case-name]]` convention) and appends a numeric suffix on collision, rather than requiring the customer to pick one or surfacing a raw database error. This is a small, self-contained fix that removes one of the two unhandled-error paths found above.

**OPEN:** whether the duplicate-email integrity error in `api/users.py` (the second unhandled path, same root cause as the slug one) should be fixed as part of this same change — this document recommends yes, on the same reasoning, since the signup endpoint (§2) is a second, equally exposed write path for both a duplicate organisation slug and a duplicate user email.

---

## 4. Become organisation administrator

**BUILT:** `users.role` is a free-text string (`models/user.py`); `require_role()` (`auth/roles.py`) checks it by exact string equality. In practice `"admin"` is the value every existing admin-gated endpoint checks for. There is no concept of an "owner" distinct from "admin," and no multi-admin provisioning flow beyond an existing admin creating another user with `role: "admin"`.

**PROPOSED:** the signup endpoint (§2) creates exactly one `users` row with `role = "admin"`, `organisation_id` set to the just-created organisation (§3), and `password_hash` computed server-side via the existing `hash_password` function (`auth/security.py`, already used by `api/users.py` — reused, not reinvented). This is the entire mechanism for "becoming an administrator": there is no separate elevation step, because the first user of a brand-new organisation has no one else to be gated by.

**OPEN:** should this first admin be distinguishable from an admin created later via the existing `POST /users/` (e.g. an `is_owner` flag, relevant if ownership transfer per [[licensing-model-v1]] §11 ever needs to identify a specific accountable individual rather than "any admin")? Not addressed by any reviewed document; flagged for [[licensing-compliance-worker]] given its direct relevance to Ownership Transfer.

---

## 5. Obtain a licence

Full technical design in [[licensing-service-architecture-v1]] — not duplicated here. As it bears specifically on the Day-0 experience:

**DECIDED ([[licensing-model-v1]] §9, restated):** no licensing action is fully automated — a human must approve before any licence, including the very first one, is issued.

**The central tension this document surfaces, not previously stated in [[licensing-service-architecture-v1]] or [[digital-workforce-platform-v1]]:** a self-service signup flow (§2) and a human-approval-gated first licence pull in opposite directions. If a brand-new customer must wait for a Teracom staff member to approve an `initial_issuance` request (per [[licensing-service-architecture-v1]] §10–§11) before doing *anything* else, the "self-service" signup is self-service in name only — the actual first customer experience is "fill in a form, then wait for an email that can't currently be sent either" (§0).

**PROPOSED, for review, resolving the tension above without contradicting §9's decided principle:** decouple *organisation/account creation* from *licence issuance*. The signup flow (§2–§4) completes immediately and the customer can log in right away, with the organisation in `status = pending_licence` (§3). A `licence_requests` row (`request_type = initial_issuance`, per [[licensing-service-architecture-v1]] §10) is created automatically as part of the same signup transaction, so the human-approval step (§9, §11 of that document) still gates the *licence*, exactly as decided — it just no longer gates the *account*. What a `pending_licence`-status organisation can actually do before approval (browse, configure, but not create workers? or fully locked, mirroring Locked Mode's allowlist, [[licensing-service-architecture-v1]] §18?) is an **OPEN** product decision this document does not resolve — flagged to the project owner, since it trades off "let people explore immediately" against "don't let anyone use the product before it's commercially real."

**OPEN:** should a time-boxed trial entitlement be auto-granted at signup (no human approval) precisely to bridge this gap, and would that contradict [[licensing-model-v1]] §9's "no licensing action is fully automated end-to-end"? This document takes no position — it is exactly the kind of commercial/compliance question [[licensing-compliance-worker]] should drive to a decision, not infer.

---

## 6. Create first users

**BUILT:** once an admin exists (§4), `POST /users/` (Package 7, Administration) already works exactly as designed — an admin creates additional users, one at a time, by supplying their name/email/**password** directly.

**Gap, confirmed first-hand:** there is no invitation flow. The admin must choose (or be told) the new user's password and communicate it out of band — there is no "send an invite email, user sets their own password" path, because no email capability exists (§0) and no invite-token mechanism exists in the schema. There is also **no password-reset endpoint anywhere** in `api/auth.py` — a user who forgets their password today has no self-service recovery path at all.

**PROPOSED — database change:** a `password_reset_tokens` table (`token`, `user_id`, `expires_at`, `used_at`) and, if invitation-by-email is adopted, a similarly-shaped `user_invitations` table (`token`, `organisation_id`, `email`, `role`, `invited_by_user_id`, `expires_at`, `accepted_at`). Both are **blocked on the same missing prerequisite**: a working email-send integration (§0, §16).

**OPEN:** whether invitation/password-reset is in scope for a "Day-0" architecture at all, or a Day-30+ maturity concern — this document includes it because §0's finding (no email capability) affects both signup verification (§2) and this stage identically, so solving it once serves multiple stages rather than being scoped narrowly to one.

---

## 7. Create first workers

**BUILT (Package 3):** fully operational today, and — per [[digital-workforce-platform-v1]] §6 — the one stage of the entire ten-stage journey requiring no new backend capability at all. Full detail in [[digital-workforce-platform-v1]] §2, §5, §6 — not repeated here.

**PROPOSED, specific to Day-0 sequencing:** the signup flow's final step (§2) hands off directly into worker creation (`/portal/workers/new`) rather than a generic dashboard, so the first thing a new admin does after signing up is create a worker, not discover the screen exists on their own. This is a sequencing choice, not a new capability.

---

## 8. Assign knowledge

**BUILT (Package 4).** Full detail in [[frontend-architecture]] §C.10 and [[digital-workforce-platform-v1]] §2 — not repeated here. No Day-0-specific gap beyond what §2 of that document already notes (knowledge assignment requires an existing worker, so it cannot precede Stage 7 above).

---

## 9. Configure memory

**BUILT (Package 6), but "configure" overstates what exists today.** Per [[digital-workforce-platform-v1]] §10 (restated briefly here since it is directly relevant to what a Day-0 admin can actually do): memory is auto-captured on 7 fixed trigger phrases or entered manually — there is no settings surface to disable auto-capture, adjust triggers, or edit/delete a captured memory. "Configure memory," as a Day-0 stage, today means: nothing to configure. This document does not propose a memory-settings surface — that is a larger design question flagged, not resolved, in [[digital-workforce-platform-v1]] §10.

---

## 10. Operate the first digital workforce

**BUILT:** chat (Package 5), organisation administration (Package 7), and a licensing Usage & Capacity view (Package 9's frontend scaffold, currently illustrative data only per [[commerce-store-architecture-v1]]'s companion billing package and [[licensing-service-architecture-v1]] §23.1). Once §5's licence exists for real, `GET /licensing/status`/`GET /licensing/usage` (proposed in [[licensing-service-architecture-v1]] §23.1) would replace that illustrative data — this document does not redesign that bridge, only notes it as the natural conclusion of the Day-0 journey: a customer who has signed up (§2), been granted an organisation (§3) and admin role (§4), had a licence approved (§5), created users (§6) and workers (§7), assigned knowledge (§8), and started accumulating memory (§9) is now indistinguishable, from this point forward, from any existing customer this project has already built screens for.

---

## 11. Consolidated gaps

| # | Gap | Stage | Severity |
|---|---|---|---|
| 1 | No unauthenticated organisation/user bootstrap endpoint | 2–4 | Blocking — nothing else in this document matters until this exists |
| 2 | No email-sending capability anywhere in the backend | 2, 5, 6 | Blocking for verification/invitation; not blocking for the bare-minimum signup itself |
| 3 | No slug/email collision handling — unhandled integrity errors surface as raw 500s | 3, 6 | Medium, cheap to fix, exposed further once signup is public |
| 4 | No password-reset endpoint at all | 6 | Medium — pre-existing gap, not new to this design, but now user-facing sooner via self-service signup |
| 5 | No invitation flow — admin must set/communicate new users' passwords out of band | 6 | Low–Medium |
| 6 | Human-approval-gated licensing conflicts with self-service signup's implied immediacy | 5 | High — a UX/commercial tension, not a code bug; needs a product decision, not just an endpoint |
| 7 | No "pending licence" organisation state exists — every org today is implicitly fully active | 3, 5 | Medium — schema gap, prerequisite to resolving #6 |
| 8 | No settings surface for memory configuration | 9 | Low — pre-existing, restated from [[digital-workforce-platform-v1]] §10 |
| 9 | No discoverable marketing-site path from visitor to signup | 1 | Medium — content/placement gap, not a technical one |

## 12. Required backend changes (consolidated)

| Change | Stage | Notes |
|---|---|---|
| `POST /signup` — new, unauthenticated, creates `organisations` + first `users` (`role=admin`) + a `licence_requests` row in one transaction | 2–5 | The core new capability this document designs |
| Server-side slug generation with collision retry | 3 | Removes an existing unhandled-error path |
| Duplicate-email handling on both `POST /users/` and the new signup endpoint | 3, 6 | Same root cause, two call sites |
| Email-send integration (transactional provider or SMTP) | 2, 5, 6 | Prerequisite for verification, licence-approval notification, invitations, and password reset — one integration serving four stages |
| `POST /auth/password-reset/request` + `POST /auth/password-reset/confirm` | 6 | Pre-existing gap, surfaced sooner by this design |
| `POST /users/invite` + `POST /invitations/{token}/accept` (if invitation is adopted, §6) | 6 | Depends on the email integration above |
| Rate limiting on `POST /signup`, mirroring the existing `LoginRateLimiter` pattern (`auth/rate_limit.py`) | 2, 16 | Same in-process pattern already proven for `/auth/login`; same "process-local, not multi-worker-safe" caveat already documented there applies |
| Everything already listed in [[licensing-service-architecture-v1]] §24.5 | 5 | Not restated here — link, not duplicate |

## 13. Required frontend changes (consolidated)

| Change | Stage | Notes |
|---|---|---|
| `/signup` — new public route, wizard-tier per [[ux-vision]] | 2 | Outside `app/portal/(protected)/**`; new nested layout, since it must not inherit the authenticated-session redirect the rest of `/portal/**` uses |
| `app/api/portal/signup/route.js` (or equivalent) — BFF proxy, same pattern as the existing `app/api/auth/login/route.js` | 2 | Never call the backend directly from a client component (ADR-002) — this new endpoint is exactly as sensitive as login, and must follow the same proxy discipline |
| A "pending licence" banner/state on `/portal/dashboard` (or equivalent), reusing the Grace/Locked preview pattern already built in Package 9 | 5, 10 | Same presentation-only caveat as that package's existing preview — real gating still requires the backend work in [[licensing-service-architecture-v1]] |
| Marketing-site CTA addition (§1) | 1 | Content/placement only, no ADR-001 exception needed |
| Password-reset and invitation-acceptance pages (if adopted) | 6 | New public routes, same pattern as `/signup` |

## 14. Required database changes (consolidated)

| Table | Change | Stage |
|---|---|---|
| `organisations` | Add `status`, `created_at`, `updated_at` | 3 |
| `users` | Add `created_at`, `updated_at`; consider `is_owner` (open, §4) | 4 |
| `password_reset_tokens` | New table | 6 |
| `user_invitations` | New table (if invitation adopted) | 6 |
| `licence_requests`, and everything else in [[licensing-service-architecture-v1]] §24.2 | New tables (already proposed there) | 5 |
| Migration framework (Alembic, per [[licensing-service-architecture-v1]] §24.1) | Prerequisite to all of the above being deployed safely | 3–6 |

---

## 15. End-to-end Day-0 sequence (proposed, narrative)

1. Visitor reaches a "Start your workforce" CTA on the marketing site (§1).
2. Visitor completes `/signup`: organisation name, their own name/email/password (§2).
3. Backend creates the organisation (`status = pending_licence`), the first user (`role = admin`), and an `initial_issuance` licence request, in one transaction (§3–§5).
4. Customer is immediately logged in (session cookie set, same mechanism as existing login, ADR-003) and lands on the dashboard showing a pending-licence state (§13).
5. **OPEN, per §5:** whether the customer can create workers/knowledge now or must wait for licence approval — this document does not resolve it, but the sequence is written assuming the more permissive answer (explore now) since that is the more genuinely "self-service" experience and is reversible if the project owner decides otherwise.
6. Teracom staff (via the `staff_users` plane, [[licensing-service-architecture-v1]] §11.1) approves the request; a signed licence is generated (§12 of that document) and the organisation's status flips to `active`.
7. Customer creates their first worker (§7), assigns knowledge (§8), starts chatting (§10) — memory begins accumulating passively (§9).
8. Customer invites teammates (§6) once invitation/email exists, or an admin manually creates their accounts in the interim.

---

## 16. Security considerations

- **The new signup endpoint is the one deliberate, narrow exception to `require_role("admin")` anywhere in this design** — every other endpoint touched by this document keeps its existing gate. This must be reviewed by [[cybersecurity-worker]] specifically because it is an intentional carve-out in an otherwise-consistent authorization model, not an oversight — the risk of a copy-paste of this pattern spreading to an endpoint that *shouldn't* be open is real and should be called out in review, not just in this document.
- **Abuse surface:** an unauthenticated, organisation-creating endpoint is a natural target for spam/automated abuse (empty shell organisations, credential-stuffing setup, resource exhaustion). Rate limiting (§12, reusing the existing `LoginRateLimiter` pattern) is the minimum control; email verification (§2) and/or CAPTCHA (§2, open) are stronger ones this document recommends but does not mandate a specific choice for.
- **The existing login-credentials-as-query-parameters quirk** (`POST /auth/login`, already documented in [[security-standards]] and `docs/backend/BACKEND_STATUS.md`) is not repeated by this design — the new `POST /signup` endpoint should take a JSON body from the start, consistent with how the frontend's BFF proxy already fully hides the login quirk from the browser (ADR-002) — this document recommends the new backend endpoint not introduce the same quirk a second time, rather than needing a second BFF workaround for it.
- **Multi-tenant isolation:** the new signup endpoint is the only place in the entire backend that creates an `organisation_id` and a `users` row referencing it *without* an already-authenticated actor scoping the write — every other write path's isolation guarantee (`organisation_id` scoping, per [[licensing-service-architecture-v1]] §22.6) rests on the caller already belonging to an organisation. This endpoint is definitionally the one exception, and should be reviewed as such, not assumed safe by analogy to the rest of the backend's isolation model.

---

## 17. Open Decisions (consolidated)

| # | Question | Section | Owner |
|---|---|---|---|
| 1 | Can a `pending_licence` organisation create workers/knowledge before approval, or is it fully locked? | 5, 15 | Project owner |
| 2 | Should a time-boxed automatic trial entitlement exist, and does it conflict with the decided no-fully-automated-licensing principle? | 5 | [[licensing-compliance-worker]] / project owner |
| 3 | Is email verification mandatory before an account is usable? | 2 | Project owner / [[cybersecurity-worker]] |
| 4 | Is CAPTCHA/bot protection required on `/signup`? | 2, 16 | [[cybersecurity-worker]] |
| 5 | Should the first admin be flagged as an "owner" distinct from later admins? | 4 | [[licensing-compliance-worker]] |
| 6 | Is invitation-by-email in scope for Day-0, or a later maturity stage? | 6 | [[project-manager-worker]] |
| 7 | Which email-send integration is adopted (own SMTP vs. a transactional provider)? | 2, 5, 6 | [[cto-worker]] / [[it-infrastructure-worker]] |

## 18. Recommendations

1. **Build the signup endpoint and its three companion database columns (`organisations.status`/timestamps, `users` timestamps) first** — this is the one change that turns "impossible" into "possible" for the entire Day-0 journey; everything else in this document is refinement on top of it.
2. **Resolve Open Decision #1 (pending-licence access) before shipping signup publicly** — shipping self-service signup without a clear answer here risks either an unintentionally-open product (if defaulted permissive without review) or a confusing dead-end experience (if defaulted locked without a visible reason why).
3. **Stand up one email-send integration early**, since it is a shared prerequisite for verification, licence-approval notification, invitations, and password reset (§12) — solving it once unblocks four stages rather than four separate small integrations.
4. **Sequence this work alongside, not after, [[licensing-service-architecture-v1]] §24.5's prerequisites** — the `initial_issuance` licence request this document's signup flow creates is inert without that document's own migration framework, staff-approval plane, and generation pipeline existing first.
5. **Fix the two unhandled-integrity-error paths (slug, email) regardless of signup's broader timeline** — they are small, self-contained, and become more exposed the moment any public-facing endpoint touches the same tables.
