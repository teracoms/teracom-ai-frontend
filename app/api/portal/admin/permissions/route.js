import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { createPermission } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { parsePermissionPayload } from '@/lib/api/validation';

// Same-origin proxy for PermissionMatrix's assign form — POST /permissions/
// is admin-gated backend-side. Removing a grant reuses the pre-existing
// app/api/portal/workers/[workerId]/knowledge route (DELETE) instead of a
// new one here — see lib/api/admin.js for why (no DELETE route exists on
// the /permissions/ router at all).
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

  const parsed = parsePermissionPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A worker and a document are both required.' }, { status: 400 });
  }

  try {
    const permission = await createPermission(token, parsed.worker_id, parsed.knowledge_id);
    return NextResponse.json({ permission });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this permission.' }, { status: 500 });
  }
}
