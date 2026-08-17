import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { assignDepartmentHead } from '@/lib/api/departments';
import { parseDepartmentHeadAssignmentPayload } from '@/lib/api/validation';

// Same-origin proxy for AssignDepartmentHeadControl →
// PATCH /departments/{department_id}/head. Admin-gated backend-side; a
// `worker_id` of `null` clears the headship. The worker (when non-null)
// must already belong to this department — the backend 400s otherwise,
// surfaced as-is rather than re-validated here.
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

  const parsed = parseDepartmentHeadAssignmentPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'worker_id (a string or null) is required.' }, { status: 400 });
  }

  try {
    const data = await assignDepartmentHead(token, params.departmentId, parsed.worker_id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this department\'s head.' }, { status: 500 });
  }
}
