import { NextResponse } from 'next/server';

import { getRefreshToken, revokeSession, clearSessionCookie } from '@/lib/api/auth';

// "Package SEC1" — a real backend revocation call now precedes the
// cookie clear. POST /auth/logout revokes the refresh token and bumps
// User.tokens_invalid_before, so the access token this browser was
// just holding stops working immediately, not just once it naturally
// expires — see auth/dependencies.py#get_current_user()'s iat check.
// revokeSession() is best-effort (see its own docstring); cookies are
// always cleared regardless of whether the backend call succeeded.
export async function POST() {
  await revokeSession(getRefreshToken());
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
