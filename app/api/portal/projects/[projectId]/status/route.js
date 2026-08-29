import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateProjectStatus } from '@/lib/api/projects';
import { parseProjectStatusPayload } from '@/lib/api/validation';

// Same-origin proxy for ProjectPanel's status control → PATCH
// /projects/{id}/status. Ungated backend-side — any org member may change
// a project's status.
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

  const parsed = parseProjectStatusPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A status of "active", "completed", "blocked", or "archived" is required.' }, { status: 400 });
  }

  try {
    const data = await updateProjectStatus(token, params.projectId, parsed.status);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this project's status." }, { status: 500 });
  }
}
