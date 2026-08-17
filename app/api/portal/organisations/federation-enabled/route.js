import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setFederationEnabled } from '@/lib/api/organisations';
import { parseFederationEnabledPayload } from '@/lib/api/validation';

// Same-origin proxy for FederationEnabledToggle →
// PATCH /organisations/federation-enabled. Admin-gated backend-side — the
// concrete governance-control deliverable (objective #6).
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

  const parsed = parseFederationEnabledPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'federation_enabled must be a boolean.' }, { status: 400 });
  }

  try {
    const data = await setFederationEnabled(token, parsed.federation_enabled);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: 'Unexpected error updating this organisation\'s federation setting.' },
      { status: 500 }
    );
  }
}
