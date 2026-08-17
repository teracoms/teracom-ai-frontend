import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateContactStage } from '@/lib/api/crm';
import { parseContactStagePayload } from '@/lib/api/validation';

// Same-origin proxy for ContactDetail → PATCH /crm/contacts/{id}/stage.
// Lead management (objective #3) — stage only ever moves forward; the
// backend 400s a backward move, surfaced as-is here.
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

  const parsed = parseContactStagePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A valid stage is required.' }, { status: 400 });
  }

  try {
    const data = await updateContactStage(token, params.contactId, parsed.stage);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this contact\'s stage.' }, { status: 500 });
  }
}
