import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchPersonaConversation } from '@/lib/api/people';

// Same-origin proxy -> GET /people/{persona_key}/conversation. Real,
// persisted history for this user's own conversation with this persona
// (scoped by user_id, not organisation-wide -- see
// teracom-ai-backend/models/chat_session.py's persona_key column).
export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchPersonaConversation(token, params.personaKey);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error loading this conversation.' }, { status: 500 });
  }
}
