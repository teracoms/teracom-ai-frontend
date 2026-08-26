import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { fetchOutputVersions } from '@/lib/api/outputArtifacts';
import { ApiError } from '@/lib/api/client';

export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchOutputVersions(token, params.projectId, params.outputId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to load version history.' }, { status: 500 });
  }
}
