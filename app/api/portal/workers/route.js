import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { createWorker } from '@/lib/api/workers';
import { ApiError } from '@/lib/api/client';
import { parseWorkerPayload } from '@/lib/api/validation';

// Same-origin proxy for CreateWorkerForm — the browser never calls
// BACKEND_API_URL directly (FRONTEND_ARCHITECTURE_V1.md §C.4). POST /workers/
// is admin-gated backend-side (require_role("admin")); this route does not
// duplicate that check, it only proxies and maps the resulting ApiError.
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

  const parsed = parseWorkerPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'Name, role, purpose and instructions are all required.' },
      { status: 400 }
    );
  }

  try {
    const worker = await createWorker(token, {
      organisation_id: parsed.organisation_id,
      name: parsed.name,
      role: parsed.role,
      purpose: parsed.purpose,
      instructions: parsed.instructions,
      status: parsed.status,
    });

    return NextResponse.json({ worker });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this worker.' }, { status: 500 });
  }
}
