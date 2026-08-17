import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { postSupportRequestMessage } from '@/lib/api/supportRequests';
import { parseSupportRequestMessagePayload } from '@/lib/api/validation';

// Same-origin proxy for SupportRequestPanel's reply form → POST
// /support-requests/{id}/messages.
export async function POST(request, { params }) {
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

  const parsed = parseSupportRequestMessagePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A message body is required.' }, { status: 400 });
  }

  try {
    const data = await postSupportRequestMessage(token, params.requestId, parsed.body);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error sending this message.' }, { status: 500 });
  }
}
