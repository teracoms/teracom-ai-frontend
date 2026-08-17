import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitDraftedContent } from '@/lib/api/marketingProduction';

// Same-origin proxy for ContentPiecePanel's "Submit for Approval" action
// (on an AI-drafted content piece) → POST /content/{id}/submit.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await submitDraftedContent(token, params.contentPieceId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this content piece.' }, { status: 500 });
  }
}
