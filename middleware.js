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
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/customer-portal')) {
    if (pathname === '/customer-portal/login') {
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

  if (pathname === '/portal/login') {
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
