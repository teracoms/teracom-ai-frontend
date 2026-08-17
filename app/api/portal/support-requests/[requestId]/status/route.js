import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateSupportRequestStatus } from '@/lib/api/supportRequests';
import { parseSupportRequestStatusPayload } from '@/lib/api/validation';

// Same-origin proxy for SupportRequestPanel's status control → PATCH
// /support-requests/{id}/status. Ungated backend-side — any org member.
export async function PATCH(request, { params }) {
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

  const parsed = parseSupportRequestStatusPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A status of "open", "in_progress", "resolved", or "closed" is required.' },
      { status: 400 }
    );
  }

  try {
    const data = await updateSupportRequestStatus(token, params.requestId, parsed.status);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this request's status." }, { status: 500 });
  }
}
