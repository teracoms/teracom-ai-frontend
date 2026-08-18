import { NextResponse } from 'next/server';

import {
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  PORTAL_CONTACT_SESSION_COOKIE_NAME,
  PORTAL_CONTACT_REFRESH_COOKIE_NAME,
} from '@/lib/api/constants';
import { BACKEND_API_URL } from '@/lib/config';
import { decodeExpiry } from '@/lib/api/edgeJwt';

// "Package SEC1" — access tokens shrank from 60 to 15 minutes once a
// real, revocable refresh token existed to carry the long-lived
// session instead (see backend auth/security.py's own comment). This
// keeps the "stay signed in for a long session" behaviour users
// already had, now via a real, revocable refresh instead of just a
// long-lived access token: near/at expiry, silently exchange the
// refresh cookie for a new access token before the request reaches
// the protected route, so a valid refresh token never surfaces as a
// forced re-login. decodeExpiry (lib/api/edgeJwt.js) is only ever
// used here to decide *whether* to refresh — the backend remains the
// sole authority on validity, exactly as lib/api/jwt.js's own
// docstring states for its own (Node-only) equivalent.
const REFRESH_WHEN_WITHIN_SECONDS = 180;
const FALLBACK_MAX_AGE_SECONDS = 15 * 60; // matches lib/api/auth.js's own fallback
const MIN_MAX_AGE_SECONDS = 60;

// Mirrors lib/api/auth.js#setSessionCookie()'s own maxAge derivation —
// duplicated rather than imported, since that module pulls in
// next/headers' cookies() (unavailable/inappropriate in middleware)
// alongside the bit of logic actually needed here.
function maxAgeForToken(token) {
  const exp = decodeExpiry(token);
  return exp
    ? Math.max(exp - Math.floor(Date.now() / 1000), MIN_MAX_AGE_SECONDS)
    : FALLBACK_MAX_AGE_SECONDS;
}

async function silentlyRefresh(accessToken, refreshToken, refreshPath) {
  const exp = decodeExpiry(accessToken);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (exp !== null && exp - nowSeconds > REFRESH_WHEN_WITHIN_SECONDS) {
    return null; // still comfortably valid — no network call needed
  }

  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BACKEND_API_URL}${refreshPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data?.access_token === 'string' ? data.access_token : null;
  } catch {
    // Backend unreachable — fall through with whatever token we had;
    // the existing presence-only check below still governs.
    return null;
  }
}

// First-line, cheap guard: redirect requests with no session cookie away from
// the authenticated app before any rendering happens. This does NOT verify
// the JWT (no signature check, no expiry check) — it only checks presence,
// since the authoritative check is the backend call in
// app/portal/(protected)/layout.js (GET /auth/me), which also naturally
// handles expired/invalid tokens. This is defense in depth, not the security
// boundary itself — see FRONTEND_ARCHITECTURE_V1.md §C.5.
//
// Phase 0 Package O added a second, entirely independent auth domain
// (/customer-portal) with its own cookie — handled as its own branch here
// rather than generalising the /portal branch, since the two session planes
// must never share a code path (mirrors the backend's own auth separation).
const PUBLIC_PORTAL_PATHS = new Set([
  '/portal/login',
  '/portal/forgot-password',
  '/portal/reset-password',
  '/portal/start-trial',
]);

// "Customer Experience & Commercial Readiness Wave" — the same fix
// Platform Review Wave 1 needed for /portal/**, now needed here too:
// these two new pages are public by definition (a signed-out
// PortalContact is exactly who needs to reach a password reset flow).
const PUBLIC_CUSTOMER_PORTAL_PATHS = new Set([
  '/customer-portal/login',
  '/customer-portal/forgot-password',
  '/customer-portal/reset-password',
]);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/customer-portal')) {
    if (PUBLIC_CUSTOMER_PORTAL_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get(PORTAL_CONTACT_SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/customer-portal/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();

    const refreshToken = request.cookies.get(PORTAL_CONTACT_REFRESH_COOKIE_NAME)?.value;
    const refreshedAccessToken = await silentlyRefresh(
      sessionToken,
      refreshToken,
      '/portal-contact/refresh'
    );

    if (refreshedAccessToken) {
      response.cookies.set(PORTAL_CONTACT_SESSION_COOKIE_NAME, refreshedAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeForToken(refreshedAccessToken),
      });
    }

    return response;
  }

  // "Platform Review Wave 1" added three more unauthenticated /portal
  // pages alongside the pre-existing /portal/login — each is public by
  // definition (a signed-out visitor is exactly who needs to reach a
  // password reset flow or a self-service trial signup).
  if (PUBLIC_PORTAL_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const refreshedAccessToken = await silentlyRefresh(sessionToken, refreshToken, '/auth/refresh');

  if (refreshedAccessToken) {
    response.cookies.set(SESSION_COOKIE_NAME, refreshedAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeForToken(refreshedAccessToken),
    });
  }

  return response;
}

export const config = {
  matcher: ['/portal/:path*', '/customer-portal/:path*'],
};
