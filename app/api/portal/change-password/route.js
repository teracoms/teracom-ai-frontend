import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { changePassword } from '@/lib/api/changePassword';
import { parseChangePasswordPayload } from '@/lib/api/validation';

// Same-origin proxy -> POST /auth/change-password. Distinct from
// app/api/auth/reset-password/route.js (the email-token forgot-password
// flow) -- this is "change my password while already signed in."
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

  const parsed = parseChangePasswordPayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'Your current password and a new password are both required.' }, { status: 400 });
  }

  try {
    const data = await changePassword(token, parsed.current_password, parsed.new_password);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error changing your password.' }, { status: 500 });
  }
}
