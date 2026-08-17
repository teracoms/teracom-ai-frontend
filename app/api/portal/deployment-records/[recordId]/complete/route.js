import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { completeDeploymentRecord } from '@/lib/api/deploymentRecords';

// Same-origin proxy for DeploymentRecordPanel's "Mark Completed"
// action → POST /deployment-records/{id}/complete. Admin-gated
// backend-side, only from "approved". No code path here touches real
// infrastructure — this is a recorded row, never a trigger.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await completeDeploymentRecord(token, params.recordId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error completing this deployment.' }, { status: 500 });
  }
}
