import { NextResponse } from 'next/server';

import { loginWithCredentials, fetchCurrentUser, setSessionCookie, setRefreshCookie } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { parseLoginCredentials } from '@/lib/api/validation';

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const credentials = parseLoginCredentials(payload);

  if (!credentials.valid) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  try {
    const loginResult = await loginWithCredentials(
      credentials.email,
      credentials.password,
      request.headers.get('user-agent')
    );

    // "Settings & Security V1" -- an account with MFA enabled gets a
    // short-lived challenge token instead of real tokens; no cookies
    // are set yet. The client collects a code and redeems it via
    // POST /api/auth/mfa-verify (app/api/auth/mfa-verify/route.js),
    // which sets these same two cookies on success. Every account
    // WITHOUT MFA enabled (the default) is completely unaffected --
    // loginResult still has access_token/refresh_token exactly as
    // before.
    if (loginResult.mfa_required) {
      return NextResponse.json({
        mfaRequired: true,
        challengeToken: loginResult.mfa_challenge_token,
      });
    }

    const { access_token: accessToken, refresh_token: refreshToken } = loginResult;

    const user = await fetchCurrentUser(accessToken);

    setSessionCookie(request, accessToken);
    setRefreshCookie(request, refreshToken);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError) {
      const headers = {};
      if (error.details?.retryAfter) {
        headers['Retry-After'] = error.details.retryAfter;
      }

      // Map backend "reach failure" (status 0) to 502 — the credentials were
      // never invalid, the backend just wasn't reachable.
      const status = error.status === 0 ? 502 : error.status;

      return NextResponse.json({ error: error.message }, { status, headers });
    }

    return NextResponse.json({ error: 'Unexpected error signing in.' }, { status: 500 });
  }
}
