import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { draftScript } from '@/lib/api/marketingProduction';
import { parseMarketingDraftPayload } from '@/lib/api/validation';

// Same-origin proxy for VideoAssetPanel's "Draft with AI" action →
// POST /videos/draft-script. Gated backend-side by the
// "marketing_intelligence" capability (Enterprise+) — a 403 here just
// means this organisation's tier doesn't include it, surfaced as-is.
// content_piece_id, if given, must reference an approved content piece —
// the concrete Content Producer -> Video Producer pipeline handoff
// (objective #12). Produces a "draft"-status video asset a human must
// still explicitly submit.
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

  const parsed = parseMarketingDraftPayload(payload, { requireBrief: false });

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A campaign, worker, and title are all required.' }, { status: 400 });
  }

  try {
    const data = await draftScript(token, parsed.worker_id, {
      campaign_id: parsed.campaign_id,
      title: parsed.title,
      content_piece_id: parsed.content_piece_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error drafting this video script.' }, { status: 500 });
  }
}
