// Server-only session/auth helpers for the Customer Portal's own session
// plane (Phase 0 Package O) — mirrors lib/api/auth.js exactly, but targets
// /portal-contact/login (JSON body, unlike the ordinary customer /auth/login
// quirk) and uses a distinct cookie, never interchangeable with the
// staff/org-member session.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/portalContactAuth.js must only be used on the server.');
}

import { cookies } from 'next/headers';

import { backendFetch, ApiError } from './client.js';
import { getTokenExpirySeconds } from './jwt.js';
import { PORTAL_CONTACT_SESSION_COOKIE_NAME } from './constants.js';

const FALLBACK_MAX_AGE_SECONDS = 60 * 60;
const MIN_MAX_AGE_SECONDS = 60;

export async function loginWithPortalContactCredentials(email, password) {
  return backendFetch('/portal-contact/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function fetchCurrentPortalContact(token) {
  return backendFetch('/portal-contact/me', { token });
}

export function getPortalContactSessionToken() {
  return cookies().get(PORTAL_CONTACT_SESSION_COOKIE_NAME)?.value ?? null;
}

export function setPortalContactSessionCookie(token) {
  const expiry = getTokenExpirySeconds(token);
  const maxAge = expiry
    ? Math.max(expiry - Math.floor(Date.now() / 1000), MIN_MAX_AGE_SECONDS)
    : FALLBACK_MAX_AGE_SECONDS;

  cookies().set(PORTAL_CONTACT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export function clearPortalContactSessionCookie() {
  cookies().delete(PORTAL_CONTACT_SESSION_COOKIE_NAME);
}

export async function getPortalContactSession() {
  const token = getPortalContactSessionToken();
  if (!token) return null;

  try {
    return await fetchCurrentPortalContact(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
