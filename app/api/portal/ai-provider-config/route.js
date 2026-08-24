import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchAIProviderConfig, setAIProviderConfig } from '@/lib/api/aiProviderConfig';
import { parseAIProviderConfigPayload } from '@/lib/api/validation';

// Same-origin proxy for AIProviderConfigCard -> GET/PUT
// /ai-provider-config/. GET is read-open (any org member); PUT is
// admin-gated backend-side -- selecting the model/provider every
// worker in this organisation runs against.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchAIProviderConfig(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading the AI provider configuration.' }, { status: 500 });
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

  const parsed = parseAIProviderConfigPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A valid provider is required.' }, { status: 400 });
  }

  try {
    const data = await setAIProviderConfig(token, { provider: parsed.provider, model_name: parsed.model_name });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating the AI provider configuration.' }, { status: 500 });
  }
}
