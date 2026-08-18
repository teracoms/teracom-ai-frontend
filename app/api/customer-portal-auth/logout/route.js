import { NextResponse } from 'next/server';

import {
  getPortalContactRefreshToken,
  revokePortalContactSession,
  clearPortalContactSessionCookie,
} from '@/lib/api/portalContactAuth';

// "Package SEC1" — see app/api/auth/logout/route.js's identical
// comment; same real revocation, PortalContact plane.
export async function POST() {
  await revokePortalContactSession(getPortalContactRefreshToken());
  clearPortalContactSessionCookie();
  return NextResponse.json({ ok: true });
}
