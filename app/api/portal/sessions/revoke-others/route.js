import { NextResponse } from 'next/server';

import { getSessionToken, getRefreshToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { revokeOtherSessions } from '@/lib/api/sessions';

// Same-origin proxy -> POST /auth/sessions/revoke-others. "Sign out all
// other sessions" -- the caller's own current session (read from its
// own refresh-token cookie, server-side only) is excluded.
export async function POST() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await revokeOtherSessions(token, getRefreshToken());
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error signing out other sessions.' }, { status: 500 });
  }
}
