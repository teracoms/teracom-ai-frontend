import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { planCtoTask } from '@/lib/api/ctoOrchestration';
import { parseCtoPlanPayload } from '@/lib/api/validation';

// Same-origin proxy for the CTO planning UI → POST /cto/plan.
// Free of Ollama calls — just the deterministic decomposition
// heuristic and the tier gate.
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

  const parsed = parseCtoPlanPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A lead worker and an objective are both required.' }, { status: 400 });
  }

  try {
    const data = await planCtoTask(token, parsed.primary_worker_id, parsed.objective, parsed.max_hops);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error generating this plan.' }, { status: 500 });
  }
}
