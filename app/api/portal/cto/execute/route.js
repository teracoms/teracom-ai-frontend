import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { executeCtoTask } from '@/lib/api/ctoOrchestration';
import { parseCtoExecutePayload } from '@/lib/api/validation';

// Same-origin proxy for the CTO approval action → POST /cto/execute.
// Calling this route IS the human's trigger for the whole bounded
// chain, which then runs autonomously with no per-hop confirmation —
// expect this to take noticeably longer than a single chat turn,
// scaling with the number of hops.
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

  const parsed = parseCtoExecutePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A lead worker and an objective are both required.' }, { status: 400 });
  }

  try {
    const data = await executeCtoTask(token, parsed.primary_worker_id, parsed.objective, parsed.steps);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error running this chain.' }, { status: 500 });
  }
}
