import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createLicenceRequest } from '@/lib/api/licensing';

// Same-origin proxy for the Billing & Licensing wizards → POST
// /licensing/requests. Phase 0 Package Q wired WorkerPackWizard's
// submission through here (request_type="worker_pack"); the backend
// endpoint itself accepts any REQUEST_TYPES value, so this route is not
// wizard-specific — it just forwards whatever the caller already validated
// client-side.
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

  if (!payload || typeof payload.request_type !== 'string') {
    return NextResponse.json({ error: 'request_type is required.' }, { status: 400 });
  }

  try {
    const data = await createLicenceRequest(token, payload);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this request.' }, { status: 500 });
  }
}
