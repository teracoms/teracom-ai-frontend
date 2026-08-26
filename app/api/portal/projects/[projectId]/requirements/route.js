import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchLatestRequirements, updateRequirementsContent } from '@/lib/api/requirements';

// Same-origin proxy for AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2's
// Requirements Engine -> GET/PATCH /projects/{id}/requirements. GET
// returns null (not a 404) when nothing has been generated yet.
export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchLatestRequirements(token, params.projectId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error loading requirements.' }, { status: 500 });
  }
}

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

  if (!payload?.content || typeof payload.content !== 'object') {
    return NextResponse.json({ error: 'content is required.' }, { status: 400 });
  }

  try {
    const data = await updateRequirementsContent(token, params.projectId, payload.content);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error saving requirements.' }, { status: 500 });
  }
}
