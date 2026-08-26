import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateRequirementsStatus } from '@/lib/api/requirements';

// Same-origin proxy -> PATCH /projects/{id}/requirements/status. A status
// change mutates the current latest version in place -- it is not itself
// new content, so it does not create a new version (see
// services/requirements_service.py#update_requirement_status).
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

  const status = typeof payload?.status === 'string' ? payload.status.trim() : '';
  if (!status) {
    return NextResponse.json({ error: 'A status is required.' }, { status: 400 });
  }

  try {
    const data = await updateRequirementsStatus(token, params.projectId, status);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const responseStatus = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status: responseStatus });
    }
    return NextResponse.json({ error: 'Unable to update requirement status.' }, { status: 500 });
  }
}
