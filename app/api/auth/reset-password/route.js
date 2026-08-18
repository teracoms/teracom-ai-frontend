import { NextResponse } from 'next/server';

import { confirmPasswordReset } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { parseResetPasswordPayload } from '@/lib/api/validation';

// Same-origin proxy for ResetPasswordForm → POST /auth/reset-password.
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseResetPasswordPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A reset link token and a password of at least 8 characters are required.' },
      { status: 400 }
    );
  }

  try {
    const data = await confirmPasswordReset(parsed.token, parsed.newPassword);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error resetting this password.' }, { status: 500 });
  }
}
