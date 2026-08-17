import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateContactHealth } from '@/lib/api/crm';
import { parseContactHealthPayload } from '@/lib/api/validation';

// Same-origin proxy for ContactDetail → PATCH /crm/contacts/{id}/health.
// Customer lifecycle tracking (objective #7).
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

  const parsed = parseContactHealthPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A valid health status is required.' }, { status: 400 });
  }

  try {
    const data = await updateContactHealth(token, params.contactId, parsed.health_status);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this contact\'s health.' }, { status: 500 });
  }
}
