import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchAIProviderRoutingRules, replaceAIProviderRoutingRules } from '@/lib/api/aiProviderRoutingRules';
import { parseAIProviderRoutingRulesPayload } from '@/lib/api/validation';

// Same-origin proxy for the Custom Routing (Mode D) rule-set editor.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchAIProviderRoutingRules(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading the routing rules.' }, { status: 500 });
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

  const parsed = parseAIProviderRoutingRulesPayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'A valid rule list is required.' }, { status: 400 });
  }

  try {
    const data = await replaceAIProviderRoutingRules(token, parsed.rules);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error saving the routing rules.' }, { status: 500 });
  }
}
