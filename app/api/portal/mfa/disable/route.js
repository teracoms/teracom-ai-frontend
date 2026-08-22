import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { disableMfa } from '@/lib/api/mfa';
import { parseMfaDisablePayload } from '@/lib/api/validation';

// Same-origin proxy -> POST /auth/mfa/disable.
export async function POST(request) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseMfaDisablePayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'Your password and a current code are both required.' }, { status: 400 });
  }

  try {
    const data = await disableMfa(token, parsed.password, parsed.code);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error disabling MFA.' }, { status: 500 });
  }
}
