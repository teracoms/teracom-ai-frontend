import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { updateOrganisationProfile } from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for the wizard's Organisation Setup step ->
// PATCH /organisations/profile (country/business_size, and CUSTOMER_
// ONBOARDING_WIZARD_V1.md Step 2's primary_brand_color/secondary_brand_color).
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
    const data = await updateOrganisationProfile(token, payload);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating your organisation.' }, { status: 500 });
  }
}
