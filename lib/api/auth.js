// Server-only session/auth helpers. Wraps teracom-ai-backend's /auth/* endpoints
// and the httpOnly session cookie. See FRONTEND_ARCHITECTURE_V1.md §C.4/§C.5.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/auth.js must only be used on the server.');
}

import { cookies } from 'next/headers';

import { backendFetch, ApiError } from './client.js';
import { getTokenExpirySeconds } from './jwt.js';
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME } from './constants.js';
import { isSecureRequest } from './requestProtocol.js';

const FALLBACK_MAX_AGE_SECONDS = 15 * 60; // matches the backend's current 15-minute access-token default
const MIN_MAX_AGE_SECONDS = 60;

// "Package SEC1" — the refresh token's own cookie lifetime. Kept as a
// literal here (not derived from the backend's REFRESH_TOKEN_EXPIRE_DAYS,
// which this frontend has no direct visibility into) matching how
// FALLBACK_MAX_AGE_SECONDS above is already a literal, not a shared
// constant with the backend.
const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * teracom-ai-backend's POST /auth/login reads `email`/`password` as query
 * parameters, not a JSON body (no LoginRequest model exists backend-side —
 * see FRONTEND_ARCHITECTURE_V1.md §B.5.2). Sending them as query params here,
 * server-side, keeps that quirk out of the browser entirely: the credentials
 * never appear in a client-visible URL, network tab, or browser history.
 *
 * `userAgent`, optional -- Settings & Security V1's Active Sessions
 * feature (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.3/§3). Every call to
 * this backend arrives via this frontend's own BFF layer (ADR-002), so
 * without this, the backend's own request.headers.get("user-agent")
 * would only ever see this Node server's own fetch implementation
 * ("node"), never the real browser that's actually signing in.
 * app/api/auth/login/route.js forwards the real incoming request's own
 * User-Agent header here. `ip_address` has the same underlying
 * limitation and is NOT forwarded -- doing so correctly needs to
 * account for a reverse proxy's X-Forwarded-For in production, a real
 * decision belonging with whoever configures that deployment, not
 * assumed here.
 */
export async function loginWithCredentials(email, password, userAgent) {
  return backendFetch('/auth/login', {
    method: 'POST',
    searchParams: { email, password },
    headers: userAgent ? { 'User-Agent': userAgent } : undefined,
  });
}

export async function fetchCurrentUser(token) {
  return backendFetch('/auth/me', { token });
}

// Password reset workflow foundation ("Platform Review Wave 1"). The
// backend always returns the same generic response whether or not the
// email matches a real account — see
// services/password_reset_service.py's own docstring for why no raw
// token is ever returned here to send onward; no email-sending
// capability exists anywhere in this backend yet.
export async function requestPasswordReset(email) {
  return backendFetch('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function confirmPasswordReset(token, newPassword) {
  return backendFetch('/auth/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
  });
}

// Trial experience foundation ("Platform Review Wave 1") — a second
// self-service entry point alongside loginWithCredentials, mirroring
// its own shape (no token needed, since no session exists yet).
export async function signupTrial(payload) {
  return backendFetch('/signup/trial', {
    method: 'POST',
    body: payload,
  });
}

export function getSessionToken() {
  return cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function getRefreshToken() {
  return cookies().get(REFRESH_COOKIE_NAME)?.value ?? null;
}

/**
 * Must be called from within a Route Handler or Server Action (Next.js
 * restricts cookie mutation to those contexts) — see app/api/auth/login/route.js.
 * `request` is required so `secure` can reflect the real connection — see
 * requestProtocol.js's own docstring for why this isn't `NODE_ENV`-based.
 */
export function setSessionCookie(request, token) {
  const expiry = getTokenExpirySeconds(token);
  const maxAge = expiry
    ? Math.max(expiry - Math.floor(Date.now() / 1000), MIN_MAX_AGE_SECONDS)
    : FALLBACK_MAX_AGE_SECONDS;

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * "Package SEC1" — a second, longer-lived httpOnly cookie alongside
 * the access-token cookie above. Set once at login/signup; refreshed
 * in place by middleware.js's silent-refresh logic never re-sets this
 * cookie itself (only the access-token cookie) — the refresh token is
 * not rotated on use (see auth/security.py#issue_refresh_token()'s own
 * docstring), so it only needs to be written once per login.
 */
export function setRefreshCookie(request, token) {
  cookies().set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

/**
 * Must be called from within a Route Handler or Server Action.
 */
export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
  cookies().delete(REFRESH_COOKIE_NAME);
}

/**
 * "Package SEC1" — real, server-side session revocation, not just a
 * local cookie clear. Best-effort: if the backend is unreachable or
 * the refresh token is already invalid, the caller should still clear
 * cookies locally regardless (see app/api/auth/logout/route.js) —
 * a failed revocation call must never trap a user into a broken
 * "can't sign out" state.
 */
export async function revokeSession(refreshToken) {
  if (!refreshToken) return;

  try {
    await backendFetch('/auth/logout', {
      method: 'POST',
      token: getSessionToken(),
      body: { refresh_token: refreshToken },
    });
  } catch {
    // Deliberately swallowed — see this function's own docstring.
  }
}

/**
 * Resolves the current session's user by re-validating the cookie's token
 * against the backend (GET /auth/me) — this also naturally handles expiry
 * and "user no longer exists" (both return 401 from the backend).
 *
 * Returns null when there is no session or the session is invalid/expired.
 * Rethrows for anything else (network failure, backend 5xx) so callers can
 * distinguish "please log in" from "the service is unreachable" instead of
 * silently treating an outage as a logged-out state.
 */
export async function getSessionUser() {
  const token = getSessionToken();
  if (!token) return null;

  try {
    return await fetchCurrentUser(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
