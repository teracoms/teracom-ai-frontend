import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { consultDepartmentHeads } from '@/lib/api/departmentHeads';
import { parseDepartmentHeadConsultPayload } from '@/lib/api/validation';

// Same-origin proxy for DepartmentHeadConsultationPanel →
// POST /department-heads/consult. Calling this route IS the human's
// explicit trigger — there is no suggestion step. Both workers must be
// current department heads of the caller's own organisation and the
// orchestration_intelligence tier gate applies — enforced backend-side,
// surfaced as-is here.
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

  const parsed = parseDepartmentHeadConsultPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'Both department heads and a message are required.' },
      { status: 400 }
    );
  }

  try {
    const data = await consultDepartmentHeads(
      token,
      parsed.primary_worker_id,
      parsed.consulted_worker_id,
      parsed.message
    );
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error running this consultation.' }, { status: 500 });
  }
}
