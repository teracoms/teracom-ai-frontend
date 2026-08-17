import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createDepartment } from '@/lib/api/departments';
import { parseDepartmentPayload } from '@/lib/api/validation';

// Same-origin proxy for CreateDepartmentForm → POST /departments/.
// Admin-gated backend-side (require_role("admin")), not tier-gated —
// departments are an org-chart primitive, not an Intelligence Cloud
// capability (see MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md §2).
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

  const parsed = parseDepartmentPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A department name is required.' }, { status: 400 });
  }

  try {
    const data = await createDepartment(token, parsed.name, parsed.description);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this department.' }, { status: 500 });
  }
}
