import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { testAIProviderCredential } from '@/lib/api/aiProviderCredentials';

// Same-origin proxy for the credentials panel's "Test Connection"
// action -- re-runs verification against the already-stored key.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await testAIProviderCredential(token, params.provider);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error testing this credential.' }, { status: 500 });
  }
}
