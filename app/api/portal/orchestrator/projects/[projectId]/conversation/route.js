import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { fetchProjectConversation } from '@/lib/api/orchestrator';
import { ApiError } from '@/lib/api/client';

// Loads a project's real, persisted conversation on Workspace open ->
// GET /orchestrator/projects/{id}/conversation.
export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchProjectConversation(token, params.projectId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to load this conversation.' }, { status: 500 });
  }
}
