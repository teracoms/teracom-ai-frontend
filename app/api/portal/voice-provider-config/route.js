import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchVoiceProviderConfig, setVoiceProviderConfig } from '@/lib/api/voice';

// Same-origin proxy for the Voice Settings page -> GET/PUT
// /voice-provider-config/. GET is read-open (any org member); PUT is
// admin-gated backend-side -- mirrors app/api/portal/ai-provider-config
// exactly.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchVoiceProviderConfig(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading the voice provider configuration.' }, { status: 500 });
  }
}

export async function PUT(request) {
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

  try {
    const data = await setVoiceProviderConfig(token, {
      stt_provider: payload.stt_provider,
      tts_provider: payload.tts_provider,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating the voice provider configuration.' }, { status: 500 });
  }
}
