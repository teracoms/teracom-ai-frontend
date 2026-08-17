import { NextResponse } from 'next/server';

import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { ApiError } from '@/lib/api/client';
import { createPortalContactSupportRequest } from '@/lib/api/portalContactSupportRequests';
import { parseSupportRequestPayload } from '@/lib/api/validation';

// Same-origin proxy for the Customer Portal's support/incident form →
// POST /portal-contact/support-requests/. request_type "incident"
// automatically creates an Operations Task backend-side.
export async function POST(request) {
  const token = getPortalContactSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseSupportRequestPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A request type ("support" or "incident"), subject, and description are required.' },
      { status: 400 }
    );
  }

  try {
    const data = await createPortalContactSupportRequest(token, {
      request_type: parsed.request_type,
      subject: parsed.subject,
      description: parsed.description,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this request.' }, { status: 500 });
  }
}
