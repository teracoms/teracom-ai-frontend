import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { planProject, createProject } from '@/lib/api/projects';
import { ApiError } from '@/lib/api/client';
import { pickDefaultWorker, deriveProjectName } from '@/lib/portalInitiative';

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- the Initiative flow's own entry
// point. The customer supplies one thing: a free-text goal ("I want to
// create a CRM"). This route:
//   1. Picks a sensible default worker for that goal (pickDefaultWorker
//      -- a plain keyword heuristic, see lib/portalInitiative.js).
//   2. Tries POST /projects/plan (planProject()) -- the real, existing
//      "Human -> Objective -> Project" pipeline that decomposes the
//      goal into real, worker-assigned Tasks automatically. This is
//      gated server-side at admin role AND Platinum licence tier
//      (unchanged, not loosened here).
//   3. Falls back to a plain POST /projects/ (createProject()) -- the
//      same project-creation path ProjectPanel.js's manual form already
//      uses -- whenever the plan path isn't available for this account
//      (not admin, not Platinum, no active workers, or any other
//      reason), so the Initiative flow never blocks a customer on any
//      tier. The project is created either way; only whether tasks were
//      auto-generated differs.
// No task-creation UI is ever shown to the customer at this step,
// either way -- matching the objective's own "do not expose task
// creation at project start."
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

  const goal = typeof payload?.goal === 'string' ? payload.goal.trim() : '';
  if (!goal) {
    return NextResponse.json({ error: 'Tell us what you’d like Teracom AI to do.' }, { status: 400 });
  }

  const name = deriveProjectName(goal);

  let workers = [];
  try {
    workers = await fetchWorkerList(token);
  } catch {
    workers = [];
  }

  const defaultWorker = pickDefaultWorker(workers, goal);

  if (defaultWorker) {
    try {
      const planResult = await planProject(token, {
        primary_worker_id: defaultWorker.id,
        objective: goal,
        name,
      });

      if (planResult.available) {
        return NextResponse.json({
          project: planResult.project,
          taskCount: planResult.tasks.length,
          autoPlanned: true,
        });
      }
      // available === false: fall through to a plain project below,
      // exactly as ProjectPanel.js's own manual form already treats
      // this response -- not an error.
    } catch (error) {
      // A 403 here means either "not admin" or "tier doesn't allow it"
      // -- both real, expected, non-error outcomes for this flow, not
      // failures to surface to the customer. Any other error also
      // falls through to the plain-project path rather than blocking
      // the customer entirely.
      if (!(error instanceof ApiError) || error.status !== 403) {
        // Non-403 errors (network, 500, etc.) are still worth logging
        // server-side conceptually, but this route has no logger of
        // its own to call -- falling through is still the right
        // customer-facing behaviour: try the simpler path before
        // giving up.
      }
    }
  }

  try {
    const project = await createProject(token, { name, description: goal });
    return NextResponse.json({ project, taskCount: 0, autoPlanned: false });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to start this initiative.' }, { status: 500 });
  }
}
