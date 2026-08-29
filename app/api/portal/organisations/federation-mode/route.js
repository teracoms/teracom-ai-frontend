import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setFederationMode } from '@/lib/api/organisations';
import { parseFederationModePayload } from '@/lib/api/validation';

// Same-origin proxy for FederationModeControl →
// PATCH /organisations/federation-mode. Admin-gated backend-side.
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

  const parsed = parseFederationModePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'federation_mode must be one of internal_only, internal_and_internet, external_providers.' },
      { status: 400 }
    );
  }

  try {
    const data = await setFederationMode(token, parsed.federation_mode);
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
