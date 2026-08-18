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
import { PORTAL_CONTACT_SESSION_COOKIE_NAME, PORTAL_CONTACT_REFRESH_COOKIE_NAME } from './constants.js';

const FALLBACK_MAX_AGE_SECONDS = 15 * 60; // matches the backend's current 15-minute access-token default
const MIN_MAX_AGE_SECONDS = 60;
const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // "Package SEC1" — see lib/api/auth.js's identical constant

export async function loginWithPortalContactCredentials(email, password) {
  return backendFetch('/portal-contact/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function fetchCurrentPortalContact(token) {
  return backendFetch('/portal-contact/me', { token });
}

// Password reset for the PortalContact identity plane ("Customer
// Experience & Commercial Readiness Wave") — closes
// TERACOM_REVIEW_BACKLOG.md's WBL-015. Mirrors lib/api/auth.js's own
// requestPasswordReset/confirmPasswordReset exactly, for
// /portal-contact/* instead of /auth/*.
export async function requestPortalContactPasswordReset(email) {
  return backendFetch('/portal-contact/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function confirmPortalContactPasswordReset(token, newPassword) {
  return backendFetch('/portal-contact/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
  });
}

export function getPortalContactSessionToken() {
  return cookies().get(PORTAL_CONTACT_SESSION_COOKIE_NAME)?.value ?? null;
}

export function getPortalContactRefreshToken() {
  return cookies().get(PORTAL_CONTACT_REFRESH_COOKIE_NAME)?.value ?? null;
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

// "Package SEC1" — see lib/api/auth.js#setRefreshCookie()'s identical
// docstring; same design, PortalContact plane.
export function setPortalContactRefreshCookie(token) {
  cookies().set(PORTAL_CONTACT_REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function clearPortalContactSessionCookie() {
  cookies().delete(PORTAL_CONTACT_SESSION_COOKIE_NAME);
  cookies().delete(PORTAL_CONTACT_REFRESH_COOKIE_NAME);
}

// "Package SEC1" — see lib/api/auth.js#revokeSession()'s identical
// docstring; same design, PortalContact plane.
export async function revokePortalContactSession(refreshToken) {
  if (!refreshToken) return;

  try {
    await backendFetch('/portal-contact/logout', {
      method: 'POST',
      token: getPortalContactSessionToken(),
      body: { refresh_token: refreshToken },
    });
  } catch {
    // Deliberately swallowed — see revokeSession()'s own docstring.
  }
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
