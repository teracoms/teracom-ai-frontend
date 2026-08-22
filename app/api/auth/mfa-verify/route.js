import { NextResponse } from 'next/server';

import { fetchCurrentUser, setSessionCookie, setRefreshCookie } from '@/lib/api/auth';
import { verifyMfaLogin } from '@/lib/api/mfa';
import { ApiError } from '@/lib/api/client';
import { parseMfaLoginVerifyPayload } from '@/lib/api/validation';

// Unauthenticated -- the caller has no session yet, only the short-lived
// mfa_challenge_token app/api/auth/login/route.js returned instead of
// real cookies. Mirrors that route's own cookie-setting exactly on
// success (SETTINGS_SECURITY_V1_ARCHITECTURE.md §2 step 5).
export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseMfaLoginVerifyPayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'A code is required.' }, { status: 400 });
  }

  try {
    const { access_token: accessToken, refresh_token: refreshToken } = await verifyMfaLogin(
      parsed.challenge_token,
      parsed.code,
      request.headers.get('user-agent')
    );

    const user = await fetchCurrentUser(accessToken);

    setSessionCookie(request, accessToken);
    setRefreshCookie(request, refreshToken);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error verifying your code.' }, { status: 500 });
  }
}
