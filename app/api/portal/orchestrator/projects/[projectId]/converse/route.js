import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { converseInProject } from '@/lib/api/orchestrator';
import { ApiError } from '@/lib/api/client';

// Persisted conversation continuation inside a project's own Workspace ->
// POST /orchestrator/projects/{id}/converse. History is read server-side
// from the real database; both turns are appended there too.
export async function POST(request, { params }) {
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

  const workerId = typeof payload?.workerId === 'string' ? payload.workerId.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!workerId || !message) {
    return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
  }

  try {
    const data = await converseInProject(token, params.projectId, { workerId, message });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to reach the Orchestrator.' }, { status: 500 });
  }
}
