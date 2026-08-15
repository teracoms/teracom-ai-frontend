// Server-only session/auth helpers. Wraps teracom-ai-backend's /auth/* endpoints
// and the httpOnly session cookie. See FRONTEND_ARCHITECTURE_V1.md §C.4/§C.5.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/auth.js must only be used on the server.');
}

import { cookies } from 'next/headers';

import { backendFetch, ApiError } from './client.js';
import { getTokenExpirySeconds } from './jwt.js';
import { SESSION_COOKIE_NAME } from './constants.js';

const FALLBACK_MAX_AGE_SECONDS = 60 * 60; // matches the backend's default 60-minute token expiry
const MIN_MAX_AGE_SECONDS = 60;

/**
 * teracom-ai-backend's POST /auth/login reads `email`/`password` as query
 * parameters, not a JSON body (no LoginRequest model exists backend-side —
 * see FRONTEND_ARCHITECTURE_V1.md §B.5.2). Sending them as query params here,
 * server-side, keeps that quirk out of the browser entirely: the credentials
 * never appear in a client-visible URL, network tab, or browser history.
 */
export async function loginWithCredentials(email, password) {
  return backendFetch('/auth/login', {
    method: 'POST',
    searchParams: { email, password },
  });
}

export async function fetchCurrentUser(token) {
  return backendFetch('/auth/me', { token });
}

export function getSessionToken() {
  return cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Must be called from within a Route Handler or Server Action (Next.js
 * restricts cookie mutation to those contexts) — see app/api/auth/login/route.js.
 */
export function setSessionCookie(token) {
  const expiry = getTokenExpirySeconds(token);
  const maxAge = expiry
    ? Math.max(expiry - Math.floor(Date.now() / 1000), MIN_MAX_AGE_SECONDS)
    : FALLBACK_MAX_AGE_SECONDS;

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Must be called from within a Route Handler or Server Action.
 */
export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
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
