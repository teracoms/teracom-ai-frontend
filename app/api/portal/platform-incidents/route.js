import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createPlatformIncident } from '@/lib/api/platformIncidents';
import { parsePlatformIncidentPayload } from '@/lib/api/validation';

// Same-origin proxy for PlatformIncidentPanel → POST
// /platform-incidents/. Ungated backend-side — any org member.
export async function POST(request) {
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

  const parsed = parsePlatformIncidentPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A title, description, and severity are all required.' }, { status: 400 });
  }

  try {
    const data = await createPlatformIncident(token, {
      title: parsed.title,
      description: parsed.description,
      severity: parsed.severity,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error reporting this incident.' }, { status: 500 });
  }
}
