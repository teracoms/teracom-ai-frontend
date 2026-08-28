import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { backendFetch, ApiError } from '@/lib/api/client';

/**
 * VOICE_MIGRATION_V1 / TERACOM_CONVERSATIONAL_EXPERIENCE_V1 Part 1 --
 * same-origin proxy for the browser's recorded audio ->
 * POST /voice/transcribe. Mirrors
 * app/api/portal/knowledge/upload/route.js's own multipart-passthrough
 * pattern exactly: the browser's FormData is handed straight to
 * backendFetch (which already special-cases a FormData body, see
 * lib/api/client.js), never re-encoded, so audio bytes are never
 * buffered into a JSON string anywhere in this app.
 *
 * A 400 here means the organisation's own VoiceProviderConfiguration
 * is not set to a self-hosted provider (this backend route has
 * nothing to do in that case -- the caller should be using
 * lib/voice/speechProvider.js's browser-native path instead); a 503
 * means the provider is configured but its own sidecar process is
 * down. Both pass through with the backend's own real detail message,
 * not a generic one.
 */
export async function POST(request) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid transcription request.' }, { status: 400 });
  }

  const audio = formData.get('audio');
  if (!audio || typeof audio === 'string') {
    return NextResponse.json({ error: 'No audio was provided to transcribe.' }, { status: 400 });
  }

  try {
    const data = await backendFetch('/voice/transcribe', { method: 'POST', token, body: formData });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error transcribing this audio.' }, { status: 500 });
  }
}
