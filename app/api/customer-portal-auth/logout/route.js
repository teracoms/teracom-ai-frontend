import { NextResponse } from 'next/server';

import { clearPortalContactSessionCookie } from '@/lib/api/portalContactAuth';

// No token-revocation endpoint exists backend-side for this plane either
// (same as /api/auth/logout) — logout only clears the local session cookie.
export async function POST() {
  clearPortalContactSessionCookie();
  return NextResponse.json({ ok: true });
}
