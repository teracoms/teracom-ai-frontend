import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createCampaign } from '@/lib/api/marketing';
import { parseCampaignPayload } from '@/lib/api/validation';

// Same-origin proxy for CampaignForm → POST /campaigns/. A Marketing
// Manager creates the campaign that starts the Content Producer -> Video
// Producer pipeline (Phase 0 Package K, objectives #5/#12) — any
// authenticated org member.
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

  const parsed = parseCampaignPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A campaign name is required.' }, { status: 400 });
  }

  try {
    const data = await createCampaign(token, {
      name: parsed.name,
      objective: parsed.objective,
      owner_worker_id: parsed.owner_worker_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this campaign.' }, { status: 500 });
  }
}
