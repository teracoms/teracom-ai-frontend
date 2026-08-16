import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { consultWorker } from '@/lib/api/orchestration';
import { parseConsultationExecutePayload } from '@/lib/api/validation';

// Same-origin proxy for the approval UI → POST /orchestration/consult.
// Calling this route IS the customer's confirmation — it runs the real
// consult-then-synthesise workflow (two live Ollama calls), so expect this
// to take noticeably longer than a single chat turn.
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

  const parsed = parseConsultationExecutePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A primary worker, a consulted worker and a message are all required.' },
      { status: 400 }
    );
  }

  try {
    const data = await consultWorker(
      token,
      parsed.primary_worker_id,
      parsed.consulted_worker_id,
      parsed.message
    );
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error running this consultation.' }, { status: 500 });
  }
}
