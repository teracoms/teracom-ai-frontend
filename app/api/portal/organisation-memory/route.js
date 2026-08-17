import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { storeOrganisationMemory } from '@/lib/api/organisationMemory';
import { parseOrganisationMemoryPayload } from '@/lib/api/validation';

// Same-origin proxy for AddOrganisationMemoryForm → POST
// /organisation-memory/store. Admin-only AND requires the Memory
// Enrichment capability (Enterprise+) — both enforced backend-side; this
// route surfaces whatever status the backend returns (403 for either gate)
// rather than re-implementing either check here.
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

  const parsed = parseOrganisationMemoryPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A memory is required.' }, { status: 400 });
  }

  try {
    const data = await storeOrganisationMemory(token, parsed.memory);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error saving this memory.' }, { status: 500 });
  }
}
