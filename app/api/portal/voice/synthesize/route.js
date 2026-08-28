import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { BACKEND_API_URL } from '@/lib/config';

/**
 * VOICE_MIGRATION_V1 / TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 --
 * same-origin proxy for POST /voice/synthesize. Deliberately NOT
 * going through lib/api/client.js#backendFetch (always parses the
 * response body as JSON -- would corrupt the real audio/wav bytes),
 * mirroring
 * app/api/portal/projects/[projectId]/outputs/[outputId]/download's
 * own proven raw-fetch pattern for streaming a binary backend
 * response through to the browser, adapted here for a POST with a
 * JSON body instead of a GET.
 */
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

  if (!payload.text || !payload.text.trim()) {
    return NextResponse.json({ error: 'text must not be empty.' }, { status: 400 });
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${BACKEND_API_URL}/voice/synthesize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: payload.text, voice: payload.voice ?? null, speed: payload.speed ?? 1.25 }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to reach the Teracom AI backend.' }, { status: 502 });
  }

  if (!backendResponse.ok) {
    const text = await backendResponse.text().catch(() => '');
    let detail;
    try {
      detail = JSON.parse(text)?.detail;
    } catch {
      detail = null;
    }
    return NextResponse.json(
      { error: typeof detail === 'string' ? detail : 'Unable to synthesize this speech.' },
      { status: backendResponse.status }
    );
  }

  const contentType = backendResponse.headers.get('content-type') ?? 'audio/wav';
  const bytes = await backendResponse.arrayBuffer();

  return new NextResponse(bytes, { status: 200, headers: { 'Content-Type': contentType } });
}
