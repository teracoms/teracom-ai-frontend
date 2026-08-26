import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { generateRequirements } from '@/lib/api/requirements';

// Same-origin proxy -> POST /projects/{id}/requirements/generate. A real
// LLM extraction from this project's own persisted conversation, not a
// client-supplied transcript.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await generateRequirements(token, params.projectId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to generate requirements right now.' }, { status: 500 });
  }
}
