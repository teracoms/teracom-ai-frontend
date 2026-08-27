import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchAIProviderCredentials } from '@/lib/api/aiProviderCredentials';

// Same-origin proxy for the AI Providers settings page's credentials
// panel. Admin-gated backend-side -- even the masked "is this
// provider configured" state is a meaningful security-posture fact.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchAIProviderCredentials(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading AI provider credentials.' }, { status: 500 });
  }
}
