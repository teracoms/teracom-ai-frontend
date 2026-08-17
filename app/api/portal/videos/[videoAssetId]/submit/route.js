import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitDraftedVideo } from '@/lib/api/marketingProduction';

// Same-origin proxy for VideoAssetPanel's "Submit for Approval" action
// (on an AI-drafted video asset) → POST /videos/{id}/submit.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await submitDraftedVideo(token, params.videoAssetId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this video asset.' }, { status: 500 });
  }
}
