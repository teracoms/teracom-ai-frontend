import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { markMediaItemPublished } from '@/lib/api/mediaCentre';

// Same-origin proxy for MediaCentreView's "Mark Published" action →
// POST /media-centre/{id}/mark-published. Admin-gated backend-side — the
// human approval gate before something becomes public (ADR-015).
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await markMediaItemPublished(token, params.itemId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error marking this item published.' }, { status: 500 });
  }
}
