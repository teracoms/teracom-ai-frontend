import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { createProjectFromConversation } from '@/lib/api/orchestrator';
import { ApiError } from '@/lib/api/client';

// "Create Project from this Conversation" -> POST /orchestrator/projects.
// Persists the entire prior conversation into the new project's own
// ChatSession server-side -- not a client-side-only pretence.
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

  const workerId = typeof payload?.workerId === 'string' ? payload.workerId.trim() : '';
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const description = typeof payload?.description === 'string' ? payload.description : undefined;
  const history = Array.isArray(payload?.history) ? payload.history : [];

  if (!workerId || !name) {
    return NextResponse.json({ error: 'A project name is required.' }, { status: 400 });
  }

  try {
    const data = await createProjectFromConversation(token, { workerId, name, description, history });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to create a project from this conversation.' }, { status: 500 });
  }
}
