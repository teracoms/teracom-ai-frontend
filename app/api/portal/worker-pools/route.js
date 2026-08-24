import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchWorkerPools, createWorkerPool } from '@/lib/api/workerPools';
import { parseWorkerPoolPayload } from '@/lib/api/validation';

// Same-origin proxy for WorkerPoolsPanel -> GET/POST /worker-pools/.
// GET is read-open (any org member); POST is admin-gated backend-side
// -- creating a pool reserves capacity against the organisation's own
// entitlement worker_limit immediately.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchWorkerPools(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading worker pools.' }, { status: 500 });
  }
}

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

  const parsed = parseWorkerPoolPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A name, role, and capacity of at least 1 are required.' }, { status: 400 });
  }

  try {
    const data = await createWorkerPool(token, {
      name: parsed.name,
      role: parsed.role,
      capacity: parsed.capacity,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this worker pool.' }, { status: 500 });
  }
}
