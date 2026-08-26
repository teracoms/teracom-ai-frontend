import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchPersonas } from '@/lib/api/people';

// Same-origin proxy -> GET /people/personas. Lists only this
// organisation's own selected executive roles, each matched to a real
// active worker where one exists (see
// teracom-ai-backend/services/orchestrator_service.py#pick_worker_for_persona).
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchPersonas(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error loading your executive team.' }, { status: 500 });
  }
}
