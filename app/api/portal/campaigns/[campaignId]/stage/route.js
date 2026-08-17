import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateCampaignStage } from '@/lib/api/marketing';
import { parseCampaignStagePayload } from '@/lib/api/validation';

// Same-origin proxy for CampaignDetail → PATCH /campaigns/{id}/stage.
// Campaign management (objective #5) — stage only ever moves forward;
// the backend 400s a backward move, surfaced as-is here.
export async function PATCH(request, { params }) {
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

  const parsed = parseCampaignStagePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A valid stage is required.' }, { status: 400 });
  }

  try {
    const data = await updateCampaignStage(token, params.campaignId, parsed.stage);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this campaign's stage." }, { status: 500 });
  }
}
