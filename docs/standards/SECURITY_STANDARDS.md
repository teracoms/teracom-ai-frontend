# Security Standards

**Applies to:** `teracom-ai-frontend`, and (advisory only, second-hand — see [[backend-status]]) awareness of `teracom-ai-backend`'s posture. These are binding rules, not suggestions — several are direct restatements of ADRs in [[architecture-decisions]] because they're security-critical enough to also live here where a Cybersecurity Specialist Worker or QA Worker will look first. See [[cybersecurity-worker]] for the role that owns this document's upkeep.

---

## 1. Credentials and session handling

- The backend's `POST /auth/login` reads credentials as query parameters, not a JSON body — a backend quirk, not a frontend choice. The frontend's BFF proxy (`app/api/auth/login/route.js`) is the *only* thing that talks to the backend directly, so this never surfaces in a browser-visible URL. Never build a code path where the browser calls the backend's login endpoint directly.
- The session JWT is stored in an `httpOnly`, `Secure`, `SameSite=Lax` cookie, never in `localStorage`/`sessionStorage`, never exposed to client-side JavaScript. This is non-negotiable given the backend has no refresh token or revocation endpoint — an XSS-leaked token from client-accessible storage would be valid until natural 60-minute expiry with no way to kill it.
- Never log the raw session token or raw credentials, including in error messages or smoke-test output.

## 2. The browser never talks to the backend directly

All backend calls happen server-side (Server Components, Route Handlers, Server Actions) via `lib/api/client.js`. This is required both because the backend has no CORS middleware (a direct browser call would simply fail) and because it's the credential-safety mechanism in §1. If a client component needs live data, route it through a same-origin `app/api/portal/*` proxy — never call `BACKEND_API_URL` from client-side code, and never add a `NEXT_PUBLIC_` prefix to that variable.

## 3. Authorization gating is presentation-only

Hiding a nav item, disabling a button at a seat limit, or checking a role client-side is a UX nicety, not a security control. The backend's `require_role`/ownership-check functions are the only real enforcement, and today there is **zero** plan/seat enforcement server-side at all. Every gated action must still call the real backend endpoint and handle its rejection (401/403/429) — never skip or soften that call because "the UI already checked."

## 4. Route guard layering

`middleware.js` checks session-cookie *presence* only (cheap, Edge-runtime, no JWT verification). The authoritative check is the `(protected)` layout's server-side call to the backend's `GET /auth/me`. Do not "upgrade" middleware to verify the JWT without first reading ADR-004 in [[architecture-decisions]] — that would require either bundling a JWT library into the Edge runtime or shipping the backend's signing secret into the frontend environment, both rejected trade-offs, not oversights.

## 5. Dependency and CVE hygiene

Before shipping any package that touches auth, middleware, or session handling, run `npm audit` and treat findings in the shipped dependency tree (not dev-only tooling) as blocking. The precedent: Next.js was patched `14.2.15` → `14.2.35` specifically because `npm audit` flagged GHSA-f82v-jwr5-mffw (a middleware authorization-bypass CVE) while new middleware was being added in the same package — shipping new middleware on a version with a known middleware-bypass CVE would have been building on a known-broken foundation.

## 6. Known standing gaps — acknowledge, don't silently "fix" without context

These are documented, deliberate trade-offs given backend constraints, not bugs to patch reflexively:

- No refresh token / no logout (revocation) endpoint on the backend — logout only clears the local cookie; the JWT remains valid until natural expiry. Acceptable given the short (60-minute) expiry; would need a backend change (revocation list or refresh-token pair) to improve.
- Login rate limiting is in-process/backend-side and resets on restart, isn't shared across instances — a backend gap, not something the frontend can fix.
- Frontend role gating has no hierarchy because the backend's role check doesn't either (exact string equality).

Before "fixing" any of these, read the relevant ADR in [[architecture-decisions]] (ADR-004, ADR-006) and the "Remaining risks" section of the relevant implementation report under `docs/frontend/IMPLEMENTATION_REPORTS/` — the trade-off was made deliberately with the backend's actual constraints in mind.

## 7. Sovereign Edition licensing — do not treat as solved

Per [[licensing-model]] §3, the offline-capable + hardware-bound + non-perpetual requirements for Sovereign Edition have an unresolved internal tension (clock-tampering resistance) and eight other open design questions. No Sovereign build work should proceed on the assumption that "offline-capable" and "term-based" are trivially compatible — they aren't, until someone (a Licensing & Compliance Worker) resolves how.

## 8. Reporting a new finding

Record newly-found vulnerabilities via a dated entry in [[changelog]] once fixed, and if the fix changes a standing decision recorded here or in [[architecture-decisions]], update both documents — don't fix silently with no trace, and don't leave this document describing a trade-off that's since changed.
