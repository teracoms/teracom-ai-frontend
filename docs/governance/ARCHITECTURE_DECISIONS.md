# Architecture Decisions

**Format:** lightweight ADR log — each entry is a decision that was actually made and shipped (or explicitly approved for future work), with the reasoning behind it, so a future worker doesn't accidentally re-litigate or reverse it without knowing why it exists. New decisions are **appended**, never rewritten in place — if a decision is superseded, add a new entry that says so and leave the old one for history.

See [[frontend-architecture]] for the full design document these are drawn from, and [[worker-operating-standards]] for when a worker is required to add a new ADR here.

---

## ADR-001 — Extend, don't redesign, the existing marketing site

**Status:** Adopted. **Source:** `FRONTEND_ARCHITECTURE_V1.md` Part C, confirmed followed in both implementation packages.

The authenticated product area is built entirely additively under `/portal/**`. Nothing in `/`, `/securityos-ai`, `/store`, `/checkout/**`, `app/layout.js`, `components/Header.js`/`Footer.js`, or the design tokens in `globals.css` is redesigned or restyled. New screens reuse the existing container width, section rhythm, button/card/badge classes, and colour tokens.

**Why:** the marketing site is a lean, deliberately-scoped asset with no legacy debt — extending it costs less and risks less than parallel-building a new design system, and keeps the authenticated app visually part of the same product family.

**How to apply:** any new screen must be checked against `globals.css`'s existing token set before adding a new CSS custom property or class family. New tokens are a last resort, not a first move.

---

## ADR-002 — BFF (backend-for-frontend) pattern; browser never talks to the backend directly

**Status:** Adopted and shipped (Package 1). **Source:** `FRONTEND_ARCHITECTURE_V1.md` §C.4, `AUTHENTICATION_IMPLEMENTATION_REPORT.md` §2.

All backend calls are made server-side, from Next.js Route Handlers or Server Components, never from client-side `fetch`. The browser only ever talks to the Next.js app's own origin.

**Why:** two independent backend constraints forced this — (1) `POST /auth/login` reads credentials as query parameters, not a JSON body, so a server-side proxy is the only way to keep credentials out of the browser's visible URL/network tab; (2) the backend has no CORS middleware at all, so direct browser→backend calls would simply fail cross-origin. The BFF pattern solves both at once without waiting on backend fixes.

**How to apply:** every new domain module under `lib/api/*` is server-only. If a client component needs live data, it calls a same-origin `app/api/portal/*` Route Handler that proxies server-side — it never calls `BACKEND_API_URL` directly. `BACKEND_API_URL` must never carry a `NEXT_PUBLIC_` prefix.

---

## ADR-003 — Session stored as an httpOnly cookie, never localStorage or client-visible state

**Status:** Adopted and shipped (Package 1). **Source:** `AUTHENTICATION_IMPLEMENTATION_REPORT.md` §2.

The backend's JWT is set as an `httpOnly`, `Secure`, `SameSite=Lax` cookie (`teracom_session`) by `app/api/auth/login/route.js`. It is never written to `document.cookie`, never returned in a client-visible response body, never placed in `localStorage`/`sessionStorage`.

**Why:** the backend issues a bare JWT with no refresh token and no revocation endpoint — if it leaks via XSS, it's valid until natural expiry with no way to invalidate it early. An httpOnly cookie is the only realistic mitigation available given that backend constraint.

**How to apply:** never add a code path that exposes the raw session token to client-side JavaScript, even for convenience (e.g. "just read it in a client component to check expiry"). Client components get identity via `AuthProvider`/`useAuth()`, seeded server-side, not via the raw token.

---

## ADR-004 — Two-layer route guard: Edge middleware (presence-only) + Server Component (authoritative)

**Status:** Adopted and shipped (Package 1). **Source:** `AUTHENTICATION_IMPLEMENTATION_REPORT.md` §2, §6.4.

`middleware.js` checks only that the session cookie is *present* before allowing a request under `/portal/**` to proceed — it does not verify the JWT signature or expiry. The authoritative check is `app/portal/(protected)/layout.js`, a Server Component that calls the backend's own `GET /auth/me`, which naturally rejects expired tokens and deleted users.

**Why:** verifying the JWT at the Edge would require either bundling a JWT library into the Edge runtime or shipping the backend's signing secret into the frontend's environment — both add real risk for a check that is advisory defense-in-depth, not the actual security boundary. Delegating the authoritative check to a real backend call means the frontend never reimplements JWT verification logic that could drift from the backend's own.

**How to apply:** never treat a middleware pass as proof of a valid session in any new code. Any screen or action with real consequences must go through a path that calls the backend and can be rejected by it. See ADR-006 (presentation-only gating) for the corollary.

---

## ADR-005 — Route groups separate public and protected `/portal` pages

**Status:** Adopted and shipped (Package 1). **Source:** `AUTHENTICATION_IMPLEMENTATION_REPORT.md` §2.

`app/portal/(public)/login/` and `app/portal/(protected)/*` are separate Next.js route groups, each with its own layout, rather than one shared guarded layout with conditional rendering.

**Why:** avoids a redirect loop between "am I logged in" and "show login form" and lets each group own the right `AuthProvider` seed (or none) without a double backend call per request.

**How to apply:** any new top-level auth state (e.g. a future "account locked" or "org suspended" state) should get its own route group rather than a conditional branch inside an existing layout, if it needs materially different chrome or guard behaviour.

---

## ADR-006 — Frontend role/plan gating is presentation-only, never a security boundary

**Status:** Adopted, standing policy. **Source:** `FRONTEND_ARCHITECTURE_V1.md` §C.5, restated in §C.12.5.

Hiding admin nav items for non-admins, or warning at a seat limit, is UI convenience only. The backend's `require_role`/`get_owned_*` checks are the only real enforcement, and today there is **no** plan/seat enforcement at all on the backend.

**Why:** the backend's role check is exact-string-equality with no hierarchy, and plan/seat limits don't exist server-side yet. Treating any frontend check as a security boundary would be actively false.

**How to apply:** never skip or soften a backend authorization call because "the UI already checked this." Every gated action must still hit the real endpoint and handle its 403/limit response. This is a permanent policy, not a placeholder to remove later — see [[security-standards]].

---

## ADR-007 — One canonical backend call per screen, ignoring redundant near-duplicate endpoints

**Status:** Adopted and shipped (Package 2). **Source:** `FRONTEND_ARCHITECTURE_V1.md` §C.6, `DASHBOARD_IMPLEMENTATION_REPORT.md` §2.

The backend exposes five-plus endpoints returning the same shape of organisation counts (`/dashboard/`, `/portal-dashboard/`, `/platform/summary`, `/system/overview`, `/stats/platform`). The dashboard calls only `GET /portal-dashboard/`, `GET /activity/`, and `GET /analytics/chat` — the other endpoints are never called.

**Why:** calling all of them would be pure waste (identical data, extra requests) and would make it ambiguous which one is "the" source of truth if they ever drift apart. Picking one canonical caller per screen keeps the frontend simple and gives the backend team a clear signal about which endpoints are actually load-bearing versus safe to deprecate.

**How to apply:** before wiring a new screen to a backend aggregate/summary endpoint, check whether an equivalent endpoint is already designated canonical elsewhere in this doc or in `frontend-architecture`. Don't add a second caller of the same underlying data shape without recording why here.

---

## ADR-008 — Per-section resilience via `Promise.allSettled`, not one page-level try/catch

**Status:** Adopted and shipped (Package 2). **Source:** `DASHBOARD_IMPLEMENTATION_REPORT.md` §4.

Independent backend calls on the same page (e.g. the dashboard's four calls) are fired concurrently and resolved individually via `lib/api/results.js#settle()`. One endpoint failing renders one inline error banner in its own section; it does not take down sections fed by other endpoints.

**Why:** the backend calls genuinely are independent (different endpoints, different failure modes — e.g. `/organisations/` is admin-gated and expected to 403 for most users) — coupling their failure handling would turn an expected, benign 403 into a page-wide error state.

**How to apply:** any screen making more than one independent backend call should use `settle()`/`errorMessage()`/`isForbidden()` from `lib/api/results.js` rather than a single wrapping try/catch, unless the calls are genuinely dependent on each other's success.

---

## ADR-009 — Sovereign Edition requires a fully separate, hardware-bound licensing architecture — no perpetual licences

**Status:** Approved (commercial decision), **not yet designed or built**. **Source:** user-approved commercial decisions, 2026-08-15.

Sovereign Edition is customer-hosted (backend runs on customer infrastructure, not Teracom's), with a signed, encrypted licence file bound to customer hardware, validated offline (no phone-home requirement), and time-bound (no perpetual licences are ever issued, even for Sovereign).

**Why:** customer-hosted deployment means Teracom cannot rely on a central server to enforce entitlement the way Starter/Enterprise do — the enforcement has to travel with the deployment. "No perpetual licences" is a deliberate commercial constraint to preserve renewal revenue and force periodic contact even with offline-capable customers.

**How to apply:** this is a placeholder decision, not an implementation — see [[licensing-model]] for the fuller design questions this raises (signing key custody, licence file format, hardware-binding mechanism, renewal/grace-period behaviour) that remain **open** and must be resolved by a Licensing & Compliance Worker or human before any Sovereign Edition build work starts. Do not begin implementation from this ADR alone.

---

## ADR-010 — Billing/licensing is out of scope for the frontend alone; requires backend schema work first

**Status:** Standing constraint, carried from `FRONTEND_ARCHITECTURE_V1.md` §C.12/§D/§E.

There is no `plan`/`status`/`seat_limit`/`stripe_customer_id` concept anywhere in the backend's data model today. The frontend cannot build a real billing/entitlement screen until the backend adds this schema and the corresponding endpoints.

**Why:** Stripe (payment) and the AI backend's organisation model (entitlement) are two disconnected systems today; a webhook-based sync point is the intended bridge, but the backend side of that bridge doesn't exist.

**How to apply:** any worker picking up billing/licensing work must start the backend schema conversation before writing frontend UI for it — see [[roadmap]] §9, which explicitly calls this out as the highest-lead-time item that should start in parallel with Package 1, not be sequenced last.

---

## ADR-011 — Licensing Model V1 approved: tiers restructured, hosting model decoupled from tier

**Status:** Approved (commercial decision); licensing lifecycle mostly decided, some mechanism-level questions remain open. **Source:** user-approved commercial decisions, 2026-08-15.

The three-edition model (Starter / Enterprise / Sovereign, where hosting was baked into the edition) is replaced by two independent axes: a **product tier** (Starter — 5 workers/10 users/1 org; Enterprise — 30 workers/Licensed User Count/up to 5 orgs; Platinum — 50 workers/Licensed User Count/up to 30 orgs) and a **hosting model** (Teracom Hosted, Dedicated Hosted, Customer Hosted (Sovereign)), selected independently. Also decided in the same pass: additional worker packs (+5/+10), a hardware fingerprint for hardware-bound licensing (VM UUID + Disk UUID + TPM where available), a mandatory human-approval step for licensing actions, an ownership-transfer workflow (allowed, human-approved), a renewal window (up to 90 days before expiry), a 30-day grace period with explicitly allowed actions, a terminal Locked Mode state after the grace period, an appliance delivery model (compiled application + signed licence + upgrade packages + configuration — no source/file access), and a two-tier support model (Teracom Support Worker, then human escalation).

**Why:** decoupling hosting location from commercial tier is more flexible than baking a single "Sovereign" edition around one hosting choice, and it gives the backend billing-schema conversation (ADR-010) concrete lifecycle requirements (renewal window, grace period, Locked Mode) to build against instead of an open question list.

**How to apply:** this supersedes the "Sovereign is a separate edition" framing in ADR-009 and the corresponding sections of [[product-editions]] and [[commercial-model]], both updated in place to match. ADR-009 is left unedited for history (append-only) — read it alongside this entry, not as the current model. [[licensing-model-v1]] is the new source of record; the original [[licensing-model]] draft is superseded (see its updated header) but its still-open items (signing key custody, licence file format, clock-tampering resistance, revocation) remain genuinely unresolved — see [[licensing-model-v1]] §19 for the consolidated list, including new open items this pass introduced (tier × hosting-model availability, upgrade/downgrade mechanics, the Partner/MSP model, and whether Tier 1 support consumes a worker seat). Do not begin build work on any item in that list without treating it as open.

---

## ADR-012 — UX principle adopted: Natural Language First, Wizard Second, Forms Last

**Status:** Approved (design direction), 2026-08-15. Roadmap/priority-ordering detail is proposed, not yet binding. **Source:** user-approved UX direction, 2026-08-15.

New screen and interaction design should be evaluated in this order of preference: (1) can the task be accomplished by asking a worker in natural language, (2) if not, can it be a short guided wizard, (3) a traditional static form is the last resort, reserved for bulk/tabular data, repeated power-user configuration, or precise/auditable input.

**Why:** Teracom AI's core product unit is a conversational Worker persona, and chat is already the platform's native, shipped interaction mode (Package 5) — administrative UI should default toward that same interaction model where feasible rather than defaulting to a second, disconnected forms/tables paradigm for everything that isn't chat.

**How to apply:** see [[ux-vision]] for the full philosophy, wizard strategy, a proposed priority list of existing form-first flows to revisit, and a design-evaluation rubric. This governs *new* screen design from this point forward — Packages 1–7 are not retroactively re-scoped by this ADR. Any new screen's implementation report should record which of the three tiers (NL / Wizard / Form) it landed on and why, per [[ux-vision]] §6.
