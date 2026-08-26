import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchRequirementsVersions } from '@/lib/api/requirements';

// Same-origin proxy -> GET /projects/{id}/requirements/versions, full
// version history newest-first.
export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchRequirementsVersions(token, params.projectId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error loading requirement versions.' }, { status: 500 });
  }
}
