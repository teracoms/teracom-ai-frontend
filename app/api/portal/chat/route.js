import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { sendChatMessage } from '@/lib/api/chat';
import { ApiError } from '@/lib/api/client';
import { parseChatMessage } from '@/lib/api/validation';

// Same-origin proxy for ChatComposer → POST /chat/. Single blocking
// request/response (no streaming — see lib/api/chat.js); this route simply
// forwards the validated payload and returns whatever the backend answers.
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

  const parsed = parseChatMessage(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A worker and a message are both required.' }, { status: 400 });
  }

  try {
    const data = await sendChatMessage(token, parsed.worker_id, parsed.message);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error sending this message.' }, { status: 500 });
  }
}
