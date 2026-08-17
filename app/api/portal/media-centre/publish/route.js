import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { publishMediaItem } from '@/lib/api/mediaCentre';
import { parseMediaPublishPayload } from '@/lib/api/validation';

// Same-origin proxy for MediaCentreView's "Publish" action →
// POST /media-centre/publish. Media Centre foundation (objective #8) —
// creates a "ready" item from an *approved* content piece or video asset
// only; the backend 400s otherwise, surfaced as-is here. The further,
// admin-only step of actually marking it published (see
// [id]/mark-published) is the second half of ADR-015's content-publishing
// governance rule.
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

  const parsed = parseMediaPublishPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A kind and title are required.' }, { status: 400 });
  }

  try {
    const data = await publishMediaItem(token, {
      kind: parsed.kind,
      title: parsed.title,
      content_piece_id: parsed.content_piece_id,
      video_asset_id: parsed.video_asset_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error publishing this item.' }, { status: 500 });
  }
}
