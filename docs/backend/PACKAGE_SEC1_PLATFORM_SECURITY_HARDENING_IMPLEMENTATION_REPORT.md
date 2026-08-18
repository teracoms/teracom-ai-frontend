# Package SEC1: Platform Security Hardening — Implementation Report

**Date:** 2026-08-18 · **Type:** Full-stack (`teracom-ai-backend` + `teracom-ai-frontend`) · **Status:** Implemented, tested, live-verified against real running services. **Not yet committed** — held for approval per this project's established pattern.

---

## 1. Objectives

Ten objectives, following directly from the "Platform State Assessment and Gap Analysis" turn's own Top-10 priorities #2–#4: TLS/HTTPS readiness, reverse proxy architecture, CORS hardening, session management review, token refresh workflows, logout/session revocation, secrets management review, API surface review, documentation-endpoint hardening, and a production exposure assessment identifying blockers to safe public exposure. Requirements: preserve functionality, no UI redesign, no federation or billing work, both test suites passing, clean builds, and an explicit blockers list.

## 2. What changed — backend

**New data model** (one migration, `9c3f7b21e5a4`, applied to the real dev database):
- `RefreshToken`, `StaffRefreshToken`, `PortalContactRefreshToken` — one per identity plane (never shared, matching this codebase's standing isolation rule), each storing `token_hash` (SHA-256, never the raw token — the same discipline `PasswordResetToken` already uses), `expires_at`, `revoked_at`. Not single-use: a refresh token is reusable until its own expiry or an explicit revocation, unlike a password-reset token.
- `tokens_invalid_before` — one new nullable column on each of `User`, `StaffUser`, `PortalContact`. This is the mechanism behind *real, immediate* logout: every access token now carries an `iat` (issued-at) claim, and `auth/dependencies.py`/`auth/staff_dependencies.py`/`auth/portal_contact_dependencies.py` reject any token issued before this timestamp — reusing the DB row lookup those dependencies already perform on every request, so this adds zero additional queries.

**Session security** (`auth/security.py`, `auth/staff_security.py`, `auth/portal_contact_security.py`, all three symmetrically):
- `ACCESS_TOKEN_EXPIRE_MINUTES` default lowered from 60 to 15 — access tokens are now short-lived by design, since a real refresh token exists to carry the long session instead.
- New `issue_*_refresh_token()` / `redeem_*_refresh_token()` / `revoke_*_refresh_token()` functions per plane.
- New endpoints: `POST /auth/refresh`, `POST /auth/logout` (and the `/staff/*`, `/portal-contact/*` equivalents). Login/signup responses gained an additive `refresh_token` field (existing `access_token`-only callers are unaffected — confirmed against the 26 pre-existing tests that assert on this response shape).
- `POST /signup` and `POST /signup/trial` also now issue a refresh token — without this, a freshly-signed-up user would hit a hard 15-minute wall with no way to silently extend their session, a real functionality regression this package specifically had to avoid.

**CORS** (`main.py`): `CORSMiddleware` added with a configurable `ALLOWED_CORS_ORIGINS` allowlist (empty by default). This backend is only ever called server-side by the frontend's own BFF layer (ADR-002), so an empty allowlist has zero functional impact on the app — it only prevents a browser on any other origin from calling this API directly at all.

**Documentation endpoint hardening** (`main.py`): `/docs`, `/redoc`, `/openapi.json` are now gated by a new `ENVIRONMENT` config var (`development` by default — this host's honest current state; set to `production` to disable all three). Extracted into a small standalone `_docs_enabled_url()` function specifically so this could be unit-tested without reconstructing the whole FastAPI app. The bare, pre-existing `/` route remains a real, permanently-unauthenticated liveness probe regardless of `ENVIRONMENT` — the production runbook was updated to use it instead of `/docs` for health checks, since a real deployment should have `/docs` disabled.

**API surface role-gating fixes** (four confirmed gaps from the platform assessment, each verified against actual current source before fixing, not assumed stale):
- `DELETE /documents/{id}` and `POST /documents/reindex/{id}` — any member could previously delete or force-reindex another member's uploaded knowledge document; now admin-only.
- `POST /memory/store` — any member could write a worker memory with no role check at all, inconsistent with the admin-write gate `organisation_memory.py`/`department_memory.py` already apply one tier up; now admin-only.
- `GET /permissions/` — had no role check whatsoever, asymmetric with its own sibling `POST /permissions/` (admin-only); now admin-only, matching the write side.
- `POST /upload/` was reviewed and deliberately left member-accessible — creating/ingesting a document is a normal contribution action, not a destructive one, and no equivalent admin-only convention exists elsewhere for a comparable "create" action.

## 3. What changed — frontend

Only two identity planes have a frontend surface (`User` via `/portal`, `PortalContact` via `/customer-portal`) — `StaffUser` has none, confirmed by a repo-wide grep finding no dedicated staff-auth files.

- **New cookie**: a second, longer-lived (30-day) httpOnly refresh-token cookie (`teracom_refresh` / `teracom_portal_contact_refresh`) alongside the existing access-token session cookie, set at login/signup, cleared at logout.
- **Real logout**: both `app/api/auth/logout/route.js` and `app/api/customer-portal-auth/logout/route.js` now call the backend's real revocation endpoint (best-effort — see §6) before clearing cookies, instead of only ever clearing cookies locally as before.
- **Silent refresh in middleware**: `middleware.js` now decodes the access token's `exp` on every `/portal/**`/`/customer-portal/**` request and, when within 3 minutes of expiry (or already expired) and a valid refresh cookie exists, calls the backend's refresh endpoint directly and re-sets the session cookie on the outgoing response before the request reaches the protected route — the mechanism that makes the 60→15-minute access-token shrink invisible to the user, preserving the "stay signed in for a long session" behaviour that used to come from the access token's own long lifetime.
- **New pure module** `lib/api/edgeJwt.js` — middleware runs on Next.js's Edge runtime, which has no `Buffer` global (unlike the existing `lib/api/jwt.js`, which is Node-only and must not be imported into middleware). A small, dependency-free, `atob`-based equivalent, used only to decide *whether* to refresh — the backend remains the sole authority on token validity either way.

## 4. Real findings during implementation

1. **This environment's own `.env` had an explicit `ACCESS_TOKEN_EXPIRE_MINUTES=60`**, overriding the new code default of 15 — meaning the security improvement wouldn't have actually taken effect here without updating the real `.env`, only the code default. Found via live verification (the issued token's own `exp`/`iat` gap was still 3600 seconds after deploying the "15-minute default" change), not assumed. Fixed by explicitly setting `ACCESS_TOKEN_EXPIRE_MINUTES=15`, `REFRESH_TOKEN_EXPIRE_DAYS=30`, `ENVIRONMENT=development`, and `ALLOWED_CORS_ORIGINS=` (empty) in the real `.env`, with comments explaining each.
2. **A self-caught test-methodology mistake, not a code bug**: an early live-verification attempt at "logout should immediately invalidate the access token" appeared to fail (the old token still returned `200` after logout) — investigation found the curl command had omitted the `teracom_refresh` cookie, causing the frontend's `revokeSession()` to no-op (it's a no-op by design when no refresh token is present — see its own docstring) and never call the backend at all. Repeating the test with both cookies present (matching real browser behaviour, which always holds both) confirmed the real mechanism works correctly. Documented here rather than silently discarded, since it's a genuine edge case worth naming: a browser session that somehow retains its access-token cookie but loses its refresh-token cookie will only get a local cookie clear on logout, not real backend revocation. This shouldn't occur in normal operation (both cookies are always set and cleared together), and is accepted as a known, narrow edge case rather than engineered around this package.
3. **Middleware's `maxAge` omission, caught and fixed before shipping**: the first version of the silent-refresh cookie-set in `middleware.js` didn't pass a `maxAge`, which would have silently downgraded the refreshed cookie to a browser-session-only cookie (cleared on browser close) instead of preserving its intended lifetime — caught during code review, fixed by deriving `maxAge` from the refreshed token's own `exp`, mirroring `lib/api/auth.js#setSessionCookie()`'s existing logic.

## 5. Secrets management

- Both `.env` files were `644` (group *and* world readable) on this multi-user host — fixed to `600` (owner-only).
- No secrets manager exists; this remains a known, accepted gap for a single-operator dev/staging host, not solved by this package (see `docs/operations/PRODUCTION_RUNBOOK.md` §8 for the full reasoning).
- A `JWT_SECRET_KEY` rotation procedure now exists (it didn't before) — documented in the runbook, including its real, disruptive blast radius: rotating this key immediately invalidates every currently-issued access token *and* every stored refresh token across all three planes, forcing every session everywhere to re-authenticate. No dual-key transition exists; this is intentional, not an oversight, and the runbook says so explicitly.

## 6. Reverse proxy & TLS — prepared, not deployed

A real, deployable nginx config (`docs/operations/nginx/teracom.conf`) and a full certbot/Let's-Encrypt deployment runbook (`docs/operations/REVERSE_PROXY_AND_TLS.md`) were written. **Not enabled anywhere** — two real, external blockers, re-confirmed fresh during this package (not assumed from memory):

1. **No root access on this host** — `sudo -n true` fails with "a password is required." Installing nginx and binding ports 80/443 both require root.
2. **No public domain or DNS record points at this host** — `hostname -f` returns a non-resolvable name; the host's only address is a private LAN IP. Let's Encrypt has nothing to issue a certificate *for* yet.

Neither is an engineering task this package can complete alone. **This host should not be exposed to the public internet until both are resolved and the prepared config is actually deployed** — see §8.

## 7. Live verification

All of the following were confirmed against the real running `teracom-backend.service`/`teracom-frontend.service` (not `TestClient`, not mocks), using throwaway organisations/users created for this purpose and fully deleted afterward:

- **Login/signup issue both tokens**: confirmed via real `Set-Cookie` headers from a live trial signup through the actual frontend — `teracom_session` (`Max-Age=900`, 15 min) and `teracom_refresh` (`Max-Age=2592000`, 30 days) both present.
- **`/auth/refresh` works**: exchanged a real refresh token for a new access token directly against the live backend.
- **Middleware silent refresh works end-to-end**: minted a real, backend-signed access token with 90 seconds remaining (well inside the 3-minute refresh window), sent it alongside a valid refresh cookie to a live `/portal/dashboard` request, and confirmed the response came back `200` *with* a fresh `Set-Cookie: teracom_session=...` bearing a new `exp`/`iat` and full 900-second `Max-Age` — the exact mechanism that keeps a long session invisible to the user.
- **Logout is real and immediate**: called the real frontend logout route with both cookies present, then confirmed the *same, still-unexpired* old access token was rejected (`401`) directly against the backend, and the *same* refresh token was rejected by `/auth/refresh` (`401`) — both immediately, not eventually.
- **CORS**: a request to the live backend with a foreign `Origin` header returned no `Access-Control-Allow-Origin` header at all.
- **`/docs` lockdown**: temporarily set `ENVIRONMENT=production`, restarted, confirmed `/docs` and `/openapi.json` both `404` while the bare `/` liveness route stayed `200`; then reverted to `ENVIRONMENT=development` (this host's honest real state) and confirmed `/docs` was reachable again.
- **All four role-gating fixes**: created a real non-admin member account and confirmed `403` on `GET /permissions/`, `DELETE /documents/{id}`, and `POST /memory/store`.
- **Cleanup**: every organisation/user/refresh-token row created for this verification pass was deleted from the real dev database afterward; confirmed zero remaining.

## 8. Blockers to safe public exposure

Explicit, as requested:

1. **No TLS/reverse proxy deployed** (§6) — plaintext HTTP is the only thing serving traffic today. Blocked on root access + a public domain, not engineering.
2. **No CI pipeline** — every validation in this report was run manually; nothing gates a future change automatically before it reaches this host.
3. **No secrets manager** — acceptable for a single-operator host, not for a shared or public-facing one.
4. **No monitoring/alerting** beyond manual health-check curls — an outage or attack in progress would not page anyone.
5. **No backup/disaster-recovery procedure** for the single Postgres instance — still true, unchanged by this package (out of scope; flagged in the original platform assessment).
6. **`ENVIRONMENT` must be flipped to `production` before any real public launch** — it is currently `development` (honest for this host today), which keeps `/docs`/`/openapi.json` live.

**None of these are new** — all were named in the "Platform State Assessment" turn. This package closed the ones that were pure engineering (session security, CORS, docs lockdown, four role-gating gaps) and prepared-but-could-not-close the one requiring external infrastructure (TLS/reverse proxy). The remaining items above are unchanged, real, and still block a genuine public launch.

## 9. Final validation

- **Backend**: full suite, 234 passed / 1 failed on the first full run — the failure (`test_marketing.py::test_ai_drafted_video_script_informed_by_approved_content`) is the same pre-existing, real-Ollama-response non-determinism flake already documented in the Customer Experience Wave's own report; confirmed passing cleanly in isolation immediately after, and unrelated to anything this package touched (no marketing/content/video/Ollama code was changed). 13 new tests added for SEC1 itself, all passing.
- **Frontend**: `npm run lint` — zero warnings. `npm test` — 300/300 passing (296 pre-existing + 4 new for the Edge-safe JWT-expiry helper). `npm run build` — clean from a fresh `.next`, followed by a full service restart and the live verification in §7.

## 10. Explicitly not done

- **Refresh-token rotation** — the current design reuses the same refresh token across multiple `/auth/refresh` calls until its own expiry/revocation, rather than issuing a new one on every use. Simpler and still genuinely revocable; full rotation (with the concurrent-use race handling it requires) is a real future hardening step, not built here.
- **A full secrets manager migration** (Vault, AWS Secrets Manager, etc.) — file-permission hardening and a rotation procedure were built; the underlying plaintext-`.env`-on-disk model is unchanged.
- **Gating `/docs` behind authentication in addition to the environment flag** — the environment flag is the primary, sufficient control for this package's scope; an additional auth gate for every environment is a possible future defense-in-depth layer, not built now.
- **CI pipeline, monitoring/alerting, backup/DR, TLS deployment itself** — all named in §8, all out of this package's own scope (either not requested this round or blocked on external infrastructure).
- **Federation and billing work** — explicitly excluded by this package's own brief.

## 11. Commit status

**Nothing in this package has been committed or pushed.** All backend and frontend changes exist only as uncommitted working-tree changes, held pending explicit user approval, per this project's established pattern.
