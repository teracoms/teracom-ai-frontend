import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createProject } from '@/lib/api/projects';
import { parseProjectPayload } from '@/lib/api/validation';

// Same-origin proxy for ProjectPanel → POST /projects/. Created directly,
// no submit/decide step — operational execution tracking, not a financial
// or contractual commitment, so any org member may create one.
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

  const parsed = parseProjectPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A project name is required.' }, { status: 400 });
  }

  try {
    const data = await createProject(token, {
      name: parsed.name,
      description: parsed.description,
      department_id: parsed.department_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this project.' }, { status: 500 });
  }
}
