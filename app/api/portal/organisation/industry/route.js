import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { updateOrganisationIndustry } from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for PATCH /organisations/industry -- a real, pre-
// existing backend endpoint (added for RECOMMENDATION_ENGINE_MVP_V1.md)
// that had no frontend caller anywhere until the onboarding wizard.
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

  if (typeof payload?.industry !== 'string' || !payload.industry.trim()) {
    return NextResponse.json({ error: 'Choose an industry.' }, { status: 400 });
  }

  try {
    const data = await updateOrganisationIndustry(token, payload.industry.trim());
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating your organisation.' }, { status: 500 });
  }
}
