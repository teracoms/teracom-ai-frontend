import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { assignWorkerKnowledge, removeWorkerKnowledge } from '@/lib/api/workers';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for WorkerKnowledgeAssignment. teracom-ai-backend's
// worker-knowledge assign/remove routes read worker_id/knowledge_id as query
// parameters (see lib/api/workers.js) — this route keeps that quirk entirely
// server-side and exposes a conventional REST-ish shape to the client:
// POST/DELETE with `knowledgeId` on the query string, `workerId` from the path.
function mapError(error) {
  if (error instanceof ApiError) {
    const status = error.status === 0 ? 502 : error.status;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(
    { error: 'Unexpected error updating this knowledge assignment.' },
    { status: 500 }
  );
}

export async function POST(request, { params }) {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const knowledgeId = request.nextUrl.searchParams.get('knowledgeId');
  if (!knowledgeId) {
    return NextResponse.json({ error: 'knowledgeId is required.' }, { status: 400 });
  }

  try {
    const data = await assignWorkerKnowledge(token, params.workerId, knowledgeId);
    return NextResponse.json(data);
  } catch (error) {
    return mapError(error);
  }
}

export async function DELETE(request, { params }) {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const knowledgeId = request.nextUrl.searchParams.get('knowledgeId');
  if (!knowledgeId) {
    return NextResponse.json({ error: 'knowledgeId is required.' }, { status: 400 });
  }

  try {
    const data = await removeWorkerKnowledge(token, params.workerId, knowledgeId);
    return NextResponse.json(data);
  } catch (error) {
    return mapError(error);
  }
}
