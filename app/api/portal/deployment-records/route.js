import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitDeploymentRecord } from '@/lib/api/deploymentRecords';
import { parseDeploymentRecordPayload } from '@/lib/api/validation';

// Same-origin proxy for DeploymentRecordPanel → POST
// /deployment-records/. Any org member may submit; only an admin may
// later decide and complete (see [recordId]/decide, [recordId]/complete).
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

  const parsed = parseDeploymentRecordPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A version label is required.' }, { status: 400 });
  }

  try {
    const data = await submitDeploymentRecord(token, {
      version_label: parsed.version_label,
      description: parsed.description,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this deployment.' }, { status: 500 });
  }
}
