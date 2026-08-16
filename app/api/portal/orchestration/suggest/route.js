import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { suggestConsultation } from '@/lib/api/orchestration';
import { parseConsultationSuggestPayload } from '@/lib/api/validation';

// Same-origin proxy for the orchestration workflow UI → POST /orchestration/suggest.
// Cheap and free of Ollama calls — just the local heuristic and tier gate.
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

  const parsed = parseConsultationSuggestPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A worker and a message are both required.' }, { status: 400 });
  }

  try {
    const data = await suggestConsultation(token, parsed.primary_worker_id, parsed.message);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error checking for a consultation.' }, { status: 500 });
  }
}
