import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { archiveDepartmentMemory } from '@/lib/api/departmentMemory';

// CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
// §H4. Same-origin proxy for the new Archive control -> PATCH
// /department-memory/{id}/archive. Admin-only backend-side, matching POST
// /department-memory/store.
export async function PATCH(request, { params }) {
  const { memoryId } = params;
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

  const departmentId = typeof payload?.department_id === 'string' ? payload.department_id : null;

  if (!departmentId) {
    return NextResponse.json({ error: 'A department id is required.' }, { status: 400 });
  }

  try {
    const data = await archiveDepartmentMemory(token, memoryId, departmentId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error archiving this memory.' }, { status: 500 });
  }
}
