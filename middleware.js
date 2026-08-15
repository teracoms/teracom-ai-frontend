import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/lib/api/constants';

// First-line, cheap guard: redirect requests with no session cookie away from
// the authenticated app before any rendering happens. This does NOT verify
// the JWT (no signature check, no expiry check) — it only checks presence,
// since the authoritative check is the backend call in
// app/portal/(protected)/layout.js (GET /auth/me), which also naturally
// handles expired/invalid tokens. This is defense in depth, not the security
// boundary itself — see FRONTEND_ARCHITECTURE_V1.md §C.5.
export function middleware(request) {
  const { pathname } = request.nextUrl;

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
  matcher: ['/portal/:path*'],
};
