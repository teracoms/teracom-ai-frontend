import { NextResponse } from 'next/server';

import { requestPortalContactPasswordReset } from '@/lib/api/portalContactAuth';
import { ApiError } from '@/lib/api/client';
import { parseForgotPasswordPayload } from '@/lib/api/validation';

// Same-origin proxy for the Customer Portal's own ForgotPasswordForm
// → POST /portal-contact/forgot-password. Mirrors
// app/api/auth/forgot-password/route.js exactly, for the PortalContact
// identity plane.
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
    const data = await requestPortalContactPasswordReset(parsed.email);
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
