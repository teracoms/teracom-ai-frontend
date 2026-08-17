import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updatePlatformIncidentStatus } from '@/lib/api/platformIncidents';
import { parsePlatformIncidentStatusPayload } from '@/lib/api/validation';

// Same-origin proxy for PlatformIncidentPanel's status control →
// PATCH /platform-incidents/{id}/status. Ungated backend-side.
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

  const parsed = parsePlatformIncidentStatusPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A status of "open", "monitoring", or "resolved" is required.' },
      { status: 400 }
    );
  }

  try {
    const data = await updatePlatformIncidentStatus(token, params.incidentId, parsed.status);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this incident's status." }, { status: 500 });
  }
}
