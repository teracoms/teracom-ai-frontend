import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { assignWorkerToPool } from '@/lib/api/workerPools';
import { parseWorkerPoolAssignmentPayload } from '@/lib/api/validation';

// Same-origin proxy for WorkerPoolsPanel -> PATCH
// /worker-pools/workers/{worker_id}. Admin-gated backend-side.
// `worker_pool_id: null` removes the worker from its current pool.
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

  const parsed = parseWorkerPoolAssignmentPayload(payload);

  try {
    const data = await assignWorkerToPool(token, params.workerId, parsed.worker_pool_id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this worker\'s pool assignment.' }, { status: 500 });
  }
}
