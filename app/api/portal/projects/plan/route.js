import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { planProject } from '@/lib/api/projects';
import { parseProjectPlanPayload } from '@/lib/api/validation';

// Same-origin proxy for the Project "Plan from Objective" form -> POST
// /projects/plan. Backend-gated at admin tier, same
// capability_allowed_for_tier(tier, "cto_orchestration")/Platinum gate
// POST /cto/plan already enforces — a 200 with { available: false }
// (no project/task created) is a normal response, not an error, when
// the organisation's tier doesn't allow it.
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

  const parsed = parseProjectPlanPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A lead worker, objective, and project name are required.' }, { status: 400 });
  }

  try {
    const data = await planProject(token, {
      primary_worker_id: parsed.primary_worker_id,
      objective: parsed.objective,
      name: parsed.name,
      department_id: parsed.department_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error planning this project.' }, { status: 500 });
  }
}
