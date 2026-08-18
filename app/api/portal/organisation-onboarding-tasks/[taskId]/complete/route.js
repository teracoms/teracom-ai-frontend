import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { completeOrganisationOnboardingTask } from '@/lib/api/organisationOnboarding';

// Same-origin proxy for the organisation onboarding checklist's "Mark
// done" action (Phase 0 Package Q) → PATCH
// /organisation-onboarding-tasks/{id}/complete. Admin-gated backend-side.
export async function PATCH(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await completeOrganisationOnboardingTask(token, params.taskId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error completing this task.' }, { status: 500 });
  }
}
