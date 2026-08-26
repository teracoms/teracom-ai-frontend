import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { converseWithPersona } from '@/lib/api/people';

// Same-origin proxy -> POST /people/{persona_key}/converse. History is
// read server-side from the real database, same shape as
// orchestrator/projects/{id}/converse -- both turns are persisted there.
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

  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
  }

  try {
    const data = await converseWithPersona(token, params.personaKey, message);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'This executive did not respond.' }, { status: 500 });
  }
}
