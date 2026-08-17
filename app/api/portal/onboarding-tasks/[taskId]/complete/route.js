import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { completeOnboardingTask } from '@/lib/api/onboardingTasks';

// Same-origin proxy for OnboardingChecklist's "Mark Complete" action →
// PATCH /onboarding-tasks/{id}/complete.
export async function PATCH(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await completeOnboardingTask(token, params.taskId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error completing this task.' }, { status: 500 });
  }
}
