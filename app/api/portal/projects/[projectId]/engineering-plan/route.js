import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { planProjectEngineering } from '@/lib/api/projects';
import { parseProjectEngineeringPlanPayload } from '@/lib/api/validation';

// PROJECT_EXECUTION_AND_VOICE_V1 -- same-origin proxy for the real,
// already-built, previously-unreachable POST /projects/{id}/engineering-plan.
// Backend-gated at admin tier, same capability_allowed_for_tier(tier,
// "cto_orchestration")/Platinum gate POST /projects/plan already
// enforces -- a 200 with { available: false } (no tasks created) is a
// normal response, not an error, when the organisation's tier doesn't
// allow it.
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

  const parsed = parseProjectEngineeringPlanPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A lead worker is required.' }, { status: 400 });
  }

  try {
    const data = await planProjectEngineering(token, params.projectId, {
      primary_worker_id: parsed.primary_worker_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error generating this project\'s engineering plan.' }, { status: 500 });
  }
}
