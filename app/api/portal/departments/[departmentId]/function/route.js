import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { assignDepartmentFunction } from '@/lib/api/departments';
import { parseDepartmentFunctionPayload } from '@/lib/api/validation';

// Same-origin proxy for DepartmentFunctionControl →
// PATCH /departments/{department_id}/function. Admin-gated backend-side; a
// `function` of `null` clears the tag.
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

  const parsed = parseDepartmentFunctionPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'function must be "sales", "customer_success", or null.' },
      { status: 400 }
    );
  }

  try {
    const data = await assignDepartmentFunction(token, params.departmentId, parsed.function);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this department\'s function.' }, { status: 500 });
  }
}
