import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { seedOnboardingTasks } from '@/lib/api/onboardingTasks';
import { parseOnboardingSeedPayload } from '@/lib/api/validation';

// Same-origin proxy for OnboardingChecklist's "Seed Checklist" action →
// POST /onboarding-tasks/seed. Creates a fixed, deterministic checklist —
// no LLM involved (objective #6).
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

  const parsed = parseOnboardingSeedPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A contact is required.' }, { status: 400 });
  }

  try {
    const data = await seedOnboardingTasks(token, parsed.crm_contact_id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error seeding onboarding tasks.' }, { status: 500 });
  }
}
