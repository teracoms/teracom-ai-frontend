import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitWorkerCreationRequest } from '@/lib/api/workerCreationRequests';
import { parseWorkerCreationRequestPayload } from '@/lib/api/validation';

// Same-origin proxy for WorkerCreationRequestPanel → POST
// /worker-creation-requests/. A second, optional path to a real
// Worker, alongside the pre-existing direct admin creation
// (POST /workers/, unchanged). Any org member may submit; only an
// admin may later decide (see [requestId]/decide).
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

  const parsed = parseWorkerCreationRequestPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A name, role, purpose, and instructions are all required.' },
      { status: 400 }
    );
  }

  try {
    const data = await submitWorkerCreationRequest(token, parsed);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this request.' }, { status: 500 });
  }
}
