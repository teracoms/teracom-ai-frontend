import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { converseWithOrchestrator } from '@/lib/api/orchestrator';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for the pre-project Orchestrator conversation ->
// POST /orchestrator/converse. Real LLM call every time -- no mock, no
// placeholder.
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
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  const history = Array.isArray(payload?.history) ? payload.history : [];
  // PROJ001 -- real conversation persistence: once the first turn
  // returns a session_id, every later call in the same conversation
  // includes it so the backend appends to the same real, resumable
  // draft session instead of starting a new one each time.
  const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId : undefined;
  // VOICE_AND_FEDERATION_REMEDIATION_V1 -- true for a turn delivered
  // from a transcribed voice utterance (components/portal/OrchestratorChat.js's
  // own deliverTranscript()), forwarded through to the backend as-is.
  const isVoice = payload?.isVoice === true;

  if (!workerId || !message) {
    return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
  }

  try {
    const data = await converseWithOrchestrator(token, { workerId, message, history, sessionId, isVoice });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to reach the Orchestrator.' }, { status: 500 });
  }
}
