import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateWorkerStatus } from '@/lib/api/workers';
import { parseWorkerStatusPayload } from '@/lib/api/validation';

// Same-origin proxy for a worker's status control → PATCH
// /workers/{id}/status. Admin-gated backend-side.
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

  const parsed = parseWorkerStatusPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A status of "active" or "inactive" is required.' }, { status: 400 });
  }

  try {
    const data = await updateWorkerStatus(token, params.workerId, parsed.status);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this worker's status." }, { status: 500 });
  }
}
