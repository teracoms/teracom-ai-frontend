import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateDepartment } from '@/lib/api/departments';
import { parseDepartmentUpdatePayload } from '@/lib/api/validation';

// Same-origin proxy for CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 --
// "Edit Department" -> PATCH /departments/{id}. Admin-gated
// backend-side, mirroring app/api/portal/departments/route.js's own
// POST handler.
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

  const parsed = parseDepartmentUpdatePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 });
  }

  try {
    const data = await updateDepartment(token, params.departmentId, {
      name: parsed.name,
      description: parsed.description,
      purpose: parsed.purpose,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this department.' }, { status: 500 });
  }
}
