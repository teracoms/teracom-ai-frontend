import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitVideo } from '@/lib/api/marketingProduction';
import { parseMarketingProductionPayload } from '@/lib/api/validation';

// Same-origin proxy for VideoAssetPanel → POST /videos/. The manual-entry
// path — created and submitted in one step. Any org member may submit;
// only an admin may later decide (see [id]/decide) — governance:
// ADR-015's content-publishing approval rule.
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

  const parsed = parseMarketingProductionPayload(payload, 'script');

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A campaign, title, and script are all required.' }, { status: 400 });
  }

  try {
    const data = await submitVideo(token, {
      campaign_id: parsed.campaign_id,
      title: parsed.title,
      script: parsed.script,
      content_piece_id: parsed.content_piece_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this video asset.' }, { status: 500 });
  }
}
