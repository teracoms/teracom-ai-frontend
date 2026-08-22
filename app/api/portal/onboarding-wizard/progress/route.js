import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { fetchOnboardingWizardProgress, updateOnboardingWizardProgress } from '@/lib/api/onboardingWizard';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for the wizard's own progress tracking / save-resume.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchOnboardingWizardProgress(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading onboarding progress.' }, { status: 500 });
  }
}

export async function PATCH(request) {
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

  try {
    const data = await updateOnboardingWizardProgress(token, payload);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating onboarding progress.' }, { status: 500 });
  }
}
