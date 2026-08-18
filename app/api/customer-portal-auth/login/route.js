import { NextResponse } from 'next/server';

import {
  loginWithPortalContactCredentials,
  fetchCurrentPortalContact,
  setPortalContactSessionCookie,
  setPortalContactRefreshCookie,
} from '@/lib/api/portalContactAuth';
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
    const { access_token: accessToken, refresh_token: refreshToken } = await loginWithPortalContactCredentials(
      credentials.email,
      credentials.password
    );

    const portalContact = await fetchCurrentPortalContact(accessToken);

    setPortalContactSessionCookie(accessToken);
    setPortalContactRefreshCookie(refreshToken);

    return NextResponse.json({ portalContact });
  } catch (error) {
    if (error instanceof ApiError) {
      const headers = {};
      if (error.details?.retryAfter) {
        headers['Retry-After'] = error.details.retryAfter;
      }

      const status = error.status === 0 ? 502 : error.status;

      return NextResponse.json({ error: error.message }, { status, headers });
    }

    return NextResponse.json({ error: 'Unexpected error signing in.' }, { status: 500 });
  }
}
