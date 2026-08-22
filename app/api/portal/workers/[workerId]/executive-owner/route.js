import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { assignWorkerExecutiveOwner } from '@/lib/api/workers';

// Same-origin proxy for CUSTOMER_ONBOARDING_WIZARD_V1.md Step 4's
// "Workforce Assignment" -> PATCH /workers/{worker_id}/executive-owner.
// Admin-gated backend-side; an `executive_owner_id` of `null` clears the
// assignment. Mirrors app/api/portal/workers/[workerId]/department/route.js
// exactly.
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

  const executiveOwnerId =
    payload?.executive_owner_id === null
      ? null
      : typeof payload?.executive_owner_id === 'string' && payload.executive_owner_id.trim()
        ? payload.executive_owner_id.trim()
        : undefined;

  if (executiveOwnerId === undefined) {
    return NextResponse.json({ error: 'executive_owner_id (a string or null) is required.' }, { status: 400 });
  }

  try {
    const data = await assignWorkerExecutiveOwner(token, params.workerId, executiveOwnerId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this executive owner assignment.' }, { status: 500 });
  }
}
