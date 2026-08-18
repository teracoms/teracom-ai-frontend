import { NextResponse } from 'next/server';

import { requestPasswordReset } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { parseForgotPasswordPayload } from '@/lib/api/validation';

// Same-origin proxy for ForgotPasswordForm → POST /auth/forgot-password.
// Pre-auth, no session cookie involved. Always returns the backend's
// own generic response (it never reveals whether the email matched a
// real account) — see services/password_reset_service.py.
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseForgotPasswordPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  try {
    const data = await requestPasswordReset(parsed.email);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      const headers = {};
      if (error.details?.retryAfter) {
        headers['Retry-After'] = error.details.retryAfter;
      }
      return NextResponse.json({ error: error.message }, { status, headers });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this request.' }, { status: 500 });
  }
}
