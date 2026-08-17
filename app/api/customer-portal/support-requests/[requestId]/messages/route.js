import { NextResponse } from 'next/server';

import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { ApiError } from '@/lib/api/client';
import { postPortalContactSupportRequestMessage } from '@/lib/api/portalContactSupportRequests';
import { parseSupportRequestMessagePayload } from '@/lib/api/validation';

// Same-origin proxy for the Customer Portal's reply form → POST
// /portal-contact/support-requests/{id}/messages. Own request only —
// enforced backend-side.
export async function POST(request, { params }) {
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

  const parsed = parseSupportRequestMessagePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A message body is required.' }, { status: 400 });
  }

  try {
    const data = await postPortalContactSupportRequestMessage(token, params.requestId, parsed.body);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error sending this message.' }, { status: 500 });
  }
}
