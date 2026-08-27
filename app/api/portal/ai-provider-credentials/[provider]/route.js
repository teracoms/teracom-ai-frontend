import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setAIProviderCredential, deleteAIProviderCredential } from '@/lib/api/aiProviderCredentials';
import { parseAIProviderCredentialPayload } from '@/lib/api/validation';

// Same-origin proxy for the credentials panel's per-provider
// add/update-key and remove-key actions.
export async function PUT(request, { params }) {
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

  const parsed = parseAIProviderCredentialPayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'A non-empty API key is required.' }, { status: 400 });
  }

  try {
    const data = await setAIProviderCredential(token, params.provider, parsed.api_key);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error saving this credential.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    await deleteAIProviderCredential(token, params.provider);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error removing this credential.' }, { status: 500 });
  }
}
