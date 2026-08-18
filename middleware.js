import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, PORTAL_CONTACT_SESSION_COOKIE_NAME } from '@/lib/api/constants';

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

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/customer-portal')) {
    if (PUBLIC_CUSTOMER_PORTAL_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    const hasPortalContactSession = Boolean(
      request.cookies.get(PORTAL_CONTACT_SESSION_COOKIE_NAME)?.value
    );

    if (!hasPortalContactSession) {
      const loginUrl = new URL('/customer-portal/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // "Platform Review Wave 1" added three more unauthenticated /portal
  // pages alongside the pre-existing /portal/login — each is public by
  // definition (a signed-out visitor is exactly who needs to reach a
  // password reset flow or a self-service trial signup).
  if (PUBLIC_PORTAL_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSession) {
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*', '/customer-portal/:path*'],
};
