import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setAIProviderCredentialEnabled } from '@/lib/api/aiProviderCredentials';

// CLOUD_PROVIDER_GUI_LIFECYCLE_V1 -- same-origin proxy for the real
// "Enable Provider"/"Disable Provider" action, distinct from adding/
// removing a key entirely.
export async function PATCH(request, { params }) {
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

  if (typeof payload?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be true or false.' }, { status: 400 });
  }

  try {
    const data = await setAIProviderCredentialEnabled(token, params.provider, payload.enabled);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this provider.' }, { status: 500 });
  }
}
