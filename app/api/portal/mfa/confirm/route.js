import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { confirmMfa } from '@/lib/api/mfa';
import { parseMfaConfirmPayload } from '@/lib/api/validation';

// Same-origin proxy -> POST /auth/mfa/confirm. Returns the backup codes
// exactly once, straight through -- this route does not store them
// anywhere.
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

  const parsed = parseMfaConfirmPayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'A 6-digit code is required.' }, { status: 400 });
  }

  try {
    const data = await confirmMfa(token, parsed.code);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error confirming MFA.' }, { status: 500 });
  }
}
