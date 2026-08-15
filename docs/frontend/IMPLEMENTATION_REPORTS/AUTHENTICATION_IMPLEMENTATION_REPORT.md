# Authentication Implementation Report — Frontend Package 1

**Scope:** Package 1 — Authentication only, per `FRONTEND_ARCHITECTURE_V1.md` §C.4/§C.5.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance.
**Out of scope (unchanged, not implemented):** Dashboard, Workers, Knowledge, Chat, Memory, Admin, Billing.

---

## 1. What was built

A BFF (backend-for-frontend) authentication layer that extends the existing Next.js App Router site without touching its public marketing/commerce pages:

1. **Login flow** — `/portal/login`, a form styled with the existing `.contact-form`/`.hero`/`.section` classes, posting to a same-origin Route Handler.
2. **Session handling** — the backend's JWT is stored in an `httpOnly` cookie (`teracom_session`), never exposed to the browser; session identity is resolved server-side on every request via the backend's own `GET /auth/me`.
3. **Logout** — clears the cookie via a Route Handler.
4. **Protected routes** — `/portal/**` (except `/portal/login`) is guarded twice: cheaply by Edge middleware (cookie presence) and authoritatively by a Server Component layout (calls the backend to validate the token).
5. **Auth provider/context** — a client-side `AuthProvider`/`useAuth()` for components that need the current user or a `logout()` action; seeded from the server, not fetched again on mount.
6. **API client layer** — a server-only `backendFetch`/`ApiError` wrapper, plus a small `lib/api/auth.js` module wrapping the backend's `/auth/*` endpoints and the cookie.
7. **Environment-based backend URL** — `BACKEND_API_URL`, server-only (not `NEXT_PUBLIC_`), read once from `lib/config.js`.
8. **Loading + error states** — login button shows "Signing in…"/"Signing out…"; inline error banner (reusing the palette's red accent, no new colours); rate-limit (429) responses surface the backend's `Retry-After` value in the error message.
9. **Redirect behaviour** — unauthenticated → `/portal/login?next=<path>`; authenticated hitting `/portal/login` → bounced to `next` (or `/portal`); successful login → `next` (or `/portal`), landing in the existing reserved `/portal` slot in the site's IA.

Nothing in `/`, `/securityos-ai`, `/store`, `/checkout/**`, the header/footer components, or the design tokens in `globals.css` was redesigned. The two-line apostrophe fixes in `app/page.js` and `app/checkout/cancel/page.js` are the only edits to pre-existing marketing content (see §5).

---

## 2. Architecture decisions (and why)

- **Credentials never touch the browser's network tab as a URL.** The backend's `POST /auth/login` reads `email`/`password` as query parameters, not a JSON body (a pre-existing backend quirk documented in `FRONTEND_ARCHITECTURE_V1.md` §B.5.2). The frontend's login form posts JSON to `/api/auth/login`; that Route Handler is the only place that talks to the backend and appends the query string, server-side. This was the specific mitigation the architecture doc called out and it's the reason the BFF pattern was non-negotiable here, not just a nicety.
- **httpOnly cookie, not localStorage.** The backend issues a bare JWT with no refresh token and no revocation endpoint. Keeping it in an httpOnly cookie set by the server (never `document.cookie`, never a client-side `fetch` response body) is the only realistic XSS mitigation available given that constraint.
- **Two-layer guard, not one.** Edge middleware (`middleware.js`) checks cookie *presence* only — cheap, but it can't verify a JWT signature/expiry without either bundling `jose` into the Edge runtime or shipping the backend's `JWT_SECRET_KEY` into the frontend's environment, both of which add real risk for a check that's advisory anyway. The authoritative check is `app/portal/(protected)/layout.js`, which calls the backend's own `GET /auth/me` — this naturally also handles token expiry and "user was deleted" without the frontend needing to reimplement JWT verification at all. This matches §C.5's explicit position that frontend gating is presentation-layer, not a security boundary.
- **Route groups, not a shared guarded layout.** `app/portal/(public)/login` and `app/portal/(protected)/*` are separate route groups so the login page and the rest of `/portal` can each own the right `<AuthProvider initialUser=…>` seed without a redirect loop or a double backend call per request.
- **Existing marketing `<Header>`/`<Footer>` were kept wrapping `/portal/**`.** The architecture doc's fuller sidebar/topbar app shell (§C.2) is scoped to when Dashboard/Workers/etc. exist; building it now for a single page (the auth landing stub) would be premature and would touch layout/navigation, which this task explicitly says not to redesign. The existing header's "Portal" nav link already points at `/portal` and needed no change.
- **Service-outage vs. logged-out are distinguished.** `getSessionUser()` returns `null` only on a `401` from the backend; any other failure (network error, 5xx) is rethrown, and `app/portal/(protected)/layout.js` renders a "we can't reach the backend" message instead of silently bouncing the user to a login form that would also fail. This was a deliberate choice to avoid a confusing UX where a backend outage looks like "you got logged out."

---

## 3. Files changed

### New files

```
lib/config.js                                  BACKEND_API_URL / SITE_URL (server-only guard)
lib/api/constants.js                           SESSION_COOKIE_NAME (shared by middleware + server code)
lib/api/jwt.js                                 pure JWT payload decode (no signature verification)
lib/api/validation.js                          pure login-payload validation
lib/api/client.js                              backendFetch() + ApiError (server-only guard)
lib/api/auth.js                                login/me calls, cookie set/clear/read, getSessionUser()
lib/api/__tests__/jwt.test.js                  unit tests
lib/api/__tests__/validation.test.js           unit tests
lib/api/__tests__/client.test.js               unit tests (mocks global.fetch)

middleware.js                                  Edge cookie-presence guard for /portal/**

app/api/auth/login/route.js                    POST — proxies backend login, sets session cookie
app/api/auth/logout/route.js                   POST — clears session cookie
app/api/auth/session/route.js                  GET  — session check for client components

app/portal/(public)/layout.js                  AuthProvider wrapper, no guard
app/portal/(public)/login/page.js              login page (redirects away if already authenticated)
app/portal/(protected)/layout.js               session guard + AuthProvider seed + outage state
app/portal/(protected)/page.js                 authenticated landing (replaces the old portal stub)

components/portal/AuthProvider.js              client context: user, loading, error, login(), logout()
components/portal/LoginForm.js                 client login form (uses .contact-form styling)
components/portal/AccountSummary.js            "Signed in as … / Sign out" (used on the landing page)

.eslintrc.json                                 next/core-web-vitals (no lint config existed before)
.gitignore                                     did not exist before this change (see §5)
FRONTEND_ARCHITECTURE_V1.md                    prior deliverable (unchanged this session)
AUTHENTICATION_IMPLEMENTATION_REPORT.md         this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `app/portal/page.js` | **Deleted** | Replaced by `app/portal/(protected)/page.js` — same URL (`/portal`), now real content behind the auth guard instead of a static placeholder. |
| `app/globals.css` | +6 lines, additive only | New `.auth-card`, `.form-error`, `.account-summary`, `.account-email` classes — all built from existing tokens (`--line`, `--red`/`--red2` equivalents, existing radii/spacing scale). No existing rule was changed. |
| `package.json` | added `"type": "module"`; `next` `14.2.15` → `14.2.35`; added `lint`/`test` scripts; added `eslint`/`eslint-config-next` devDependencies | See §5 for why each was necessary. |
| `.env.example` | +6 lines | Documents the new server-only `BACKEND_API_URL` variable, following the file's existing comment style. |
| `tsconfig.json` | reformatted (whitespace only) + `plugins: [{name:"next"}]` added | Auto-applied by `next build` the first time it ran against this repo's pre-existing (previously unused) `tsconfig.json`. Functionally identical; left as-is rather than reverting, since reverting it would just make the next `next build` reapply it. |
| `app/page.js`, `app/checkout/cancel/page.js` | `'` → `&apos;` in two sentences of existing marketing copy | See §5 — required for `next build`/`next lint` to pass now that lint tooling exists; zero visual or content change. |

---

## 4. Validation

All three requested gates were run from a clean state (`rm -rf .next`, fresh `npm install`) and pass:

```
$ npm run build   → ✓ Compiled successfully, all 19 routes built, no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 19, pass 19, fail 0
```

`npm run lint`/`npm test` did not exist as scripts before this change (no lint config, no test runner were present in the repository). Both were added as part of satisfying this task's explicit validation requirements — see §5 for the two supporting decisions that made this possible (`type: module`, the Next.js patch bump).

### Unit tests (19, `node --test`, zero new dependencies)

Cover the pure logic that doesn't require the Next.js runtime: `ApiError`/`backendFetch` (success path, non-2xx → `ApiError` with backend `detail`, 429 → `Retry-After` surfaced, network failure → status `0`), JWT payload decoding (well-formed, malformed, missing `exp`), and login-payload validation (trimming, missing fields, wrong types, null payload). Code that requires `next/headers` (`lib/api/auth.js`'s cookie functions) is not unit-testable outside the Next.js request runtime and was instead validated end-to-end (§4.1) rather than mocked.

### End-to-end smoke test (manual, against a live backend)

`teracom-ai-backend` was started locally (`uvicorn main:app`, real Postgres, real JWT signing) and the built Next.js app run against it (`next start`) with `BACKEND_API_URL=http://127.0.0.1:8000`. A temporary test user was created directly in the database for this purpose and deleted again immediately afterward — no test data was left behind.

| Check | Result |
|---|---|
| `GET /portal` with no session cookie | `307` → `/portal/login?next=%2Fportal` (middleware) |
| `POST /api/auth/login` with wrong password | `401 {"error":"Invalid credentials"}` |
| `POST /api/auth/login` with correct password | `200`, `Set-Cookie: teracom_session=…; HttpOnly`, correct `user` payload |
| `GET /portal` with valid session cookie | `200`, page HTML contains the signed-in user's email |
| `GET /portal/login` with valid session cookie | `307` → `/portal` (already authenticated, bounced away from the login form) |
| `GET /api/auth/session` with valid cookie | `200`, returns the current user |
| `POST /api/auth/logout` | `200 {"ok":true}`, cookie cleared |
| `GET /portal` after logout | `307` → `/portal/login?next=%2Fportal` (guard re-engages) |
| 6 consecutive failed logins | 6th returns `429`, `Retry-After: 900` header present, and the frontend's JSON error message includes the wait time — confirms the backend's brute-force limiter's signal survives the proxy hop |
| Rendered `/portal/login` HTML | Confirmed presence of `site-header`, `site-footer`, and the new `auth-card`/`contact-form auth-form` classes — existing chrome and design tokens are intact, nothing was replaced |

---

## 5. Incidental changes and why they were necessary

Three changes went slightly beyond "write new auth files" because the validation requirements (`build successfully`, `run linting`, `run all available tests`) exposed pre-existing gaps in the repository that blocked those gates outright. Each is minimal and reversible:

1. **`"type": "module"` added to `package.json`.** The new unit tests (`lib/api/__tests__/*.test.js`) import plain ES module `lib/*.js` files with `node --test`. Node's native loader needs either `"type": "module"` or a `.mjs` extension to parse `import`/`export` syntax outside of Next.js's own bundler. Every file in this repository already used ESM `import`/`export` syntax (there is no `require()` anywhere — verified by repo-wide grep before making this change), so this formalises what was already true rather than changing behaviour; `next build`/`next dev`/`next lint` were re-verified afterward and are unaffected (Next's bundler doesn't consult this field).
2. **Next.js patched `14.2.15` → `14.2.35`.** `npm install` flagged the pre-existing pin as carrying a critical `npm audit` advisory, including **GHSA-f82v-jwr5-mffw — an authorization bypass in Next.js Middleware** (a crafted header lets a request skip middleware entirely). This is directly relevant to this package: `middleware.js` is one of the two guard layers being added. Shipping a new middleware-based guard on a version with a known middleware-bypass CVE would be building on a known-broken foundation. The fix is a same-major, non-breaking patch release (`14.2.x` → latest `14.2.x`), not the breaking `next@16` upgrade `npm audit fix --force` would otherwise apply — that larger upgrade was deliberately not taken, since it's out of scope for an auth-only package and would need its own regression pass across the whole site.
3. **Two apostrophes escaped as `&apos;`** in pre-existing marketing copy (`app/page.js`, `app/checkout/cancel/page.js`). Adding `eslint-config-next` (needed to satisfy "run linting" at all, since no lint config existed) makes `next build` enforce `react/no-unescaped-entities`, which pre-existing copy tripped. This is a JSX-escaping technicality with **zero visual or textual change** — the character rendered in the browser is identical — not a content or design edit.

No other pre-existing file's behaviour, styling, or content was touched. The `npm audit` output still lists a small number of advisories in ESLint's own transitive dependency tree (dev-tooling only, not shipped to users or the production bundle) — left as-is, consistent with not expanding scope beyond what this package needs.

---

## 6. Remaining risks / follow-ups

Carried over from `FRONTEND_ARCHITECTURE_V1.md` §B.5/§D, now confirmed first-hand by building against the real backend:

1. **No CORS middleware on the backend.** Not a blocker for this package — the BFF pattern means the browser never calls the backend directly — but still worth fixing backend-side before anything ever needs a direct browser→backend call.
2. **No refresh token / no logout (revocation) endpoint on the backend.** `POST /api/auth/logout` only clears the local cookie; the JWT itself remains cryptographically valid until its natural 60-minute expiry. Acceptable given the short expiry, but a stolen cookie's underlying token can't be invalidated early. This needs a backend change (a revocation list or short-lived-token + refresh-token pair), not a frontend one.
3. **In-process login rate limiter.** Confirmed working in the smoke test, but the backend's own code documents that its state is per-process and resets on restart / isn't shared across multiple workers or instances — fine for the current single-process deployment, a real gap the moment the backend scales horizontally.
4. **`middleware.js`'s guard is presence-only, by design** — it does not verify the JWT. This is intentional (§2) and the authoritative check does happen (`(protected)/layout.js` → backend `/auth/me`), but it means a forged/expired cookie value gets past middleware and only fails one layer deeper. This is the correct trade-off for now (no shared secret between services), not an oversight, but worth revisiting if a shared-secret or JWKS-based Edge verification approach becomes acceptable later.
5. **Two backend accounts (`robert@teracom.ai`, `jwt@teracom.ai`) have no known-good password** — one has a literal non-hash placeholder (`"temp"`) as noted in the backend's own `FINAL_SECURITY_REMEDIATION.md`. This blocked reusing an existing account for the smoke test (hence the temporary account created and deleted for §4.1) and will block real users from that account too — a backend data-fix, not a frontend one.
6. **`next-env.d.ts`/`tsconfig.json` auto-management.** This repository has an unused `tsconfig.json` (the app is plain JS) alongside `jsconfig.json`. `next build` now auto-formats `tsconfig.json` and generates `next-env.d.ts` every time it runs. This is harmless standard Next.js behaviour, not something introduced by this package, but it's the reason `tsconfig.json` shows as modified in the diff.
7. **No password-reset/forgot-password flow.** Out of scope for this package (not in the 12 requirements) and there's no corresponding backend endpoint yet — flagging so it isn't assumed to exist.
8. **`npm audit` still reports advisories in ESLint 8's transitive dependencies** (`eslint-config-next@14.2.35` pins ESLint 8, which is EOL upstream). Dev-tooling only, not part of the shipped app; revisit when the Next.js major version is next upgraded, since `eslint-config-next` for Next 15/16 moves to ESLint 9.

None of the above block Package 2 (Dashboard) from starting — the auth foundation (`lib/api/client.js`, `getSessionUser()`, `AuthProvider`, the `(protected)` route group) is exactly what §C.6 of the architecture doc assumes is already in place.
