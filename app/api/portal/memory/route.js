import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { storeMemory } from '@/lib/api/memory';
import { ApiError } from '@/lib/api/client';
import { parseMemoryPayload } from '@/lib/api/validation';

// Same-origin proxy for AddMemoryForm → POST /memory/store. Not role-gated
// backend-side (only get_current_user + worker-ownership check) — this
// route doesn't add a restriction the backend doesn't itself enforce.
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

  const parsed = parseMemoryPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A worker and a memory are both required.' }, { status: 400 });
  }

  try {
    const memory = await storeMemory(token, parsed.worker_id, parsed.memory);
    return NextResponse.json({ memory });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error saving this memory.' }, { status: 500 });
  }
}
