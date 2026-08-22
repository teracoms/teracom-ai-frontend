import { NextResponse } from 'next/server';

import { getSessionToken, getRefreshToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchSessions } from '@/lib/api/sessions';

// Same-origin proxy -> GET /auth/sessions. Reads the caller's own
// current refresh-token cookie server-side only to flag which row is
// this session -- the raw value never reaches the browser.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchSessions(token, getRefreshToken());
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading your sessions.' }, { status: 500 });
  }
}
