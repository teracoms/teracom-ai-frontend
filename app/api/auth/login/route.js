import { NextResponse } from 'next/server';

import { loginWithCredentials, fetchCurrentUser, setSessionCookie } from '@/lib/api/auth';
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
    const { access_token: accessToken } = await loginWithCredentials(
      credentials.email,
      credentials.password
    );

    const user = await fetchCurrentUser(accessToken);

    setSessionCookie(accessToken);

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
