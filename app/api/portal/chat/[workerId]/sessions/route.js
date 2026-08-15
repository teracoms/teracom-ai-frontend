import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { createChatSession } from '@/lib/api/chat';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for ChatSessionStarter → POST /chat-sessions/{workerId}.
// Creates a new, empty tracked session — see lib/api/chat.js for why this is
// deliberately a separate concept from the live composer's POST /chat/ calls.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const session = await createChatSession(token, params.workerId);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error starting a session.' }, { status: 500 });
  }
}
