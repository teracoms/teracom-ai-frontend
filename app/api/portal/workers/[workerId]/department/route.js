import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { assignWorkerDepartment } from '@/lib/api/departments';

// Same-origin proxy for AssignWorkerDepartmentControl →
// PATCH /workers/{worker_id}/department. Admin-gated backend-side; a
// `departmentId` of `null` clears the assignment.
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

  const departmentId =
    payload?.department_id === null
      ? null
      : typeof payload?.department_id === 'string' && payload.department_id.trim()
        ? payload.department_id.trim()
        : undefined;

  if (departmentId === undefined) {
    return NextResponse.json({ error: 'department_id (a string or null) is required.' }, { status: 400 });
  }

  try {
    const data = await assignWorkerDepartment(token, params.workerId, departmentId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this department assignment.' }, { status: 500 });
  }
}
