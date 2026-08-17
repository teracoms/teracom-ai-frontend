import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { decideContract } from '@/lib/api/dealDocuments';
import { parseDealDecisionPayload } from '@/lib/api/validation';

// Same-origin proxy for DealDocumentPanel's approve/reject action →
// POST /contracts/{id}/decide. Admin-gated backend-side.
export async function POST(request, { params }) {
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

  const parsed = parseDealDecisionPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A decision of "approved" or "rejected" is required.' }, { status: 400 });
  }

  try {
    const data = await decideContract(token, params.contractId, parsed.decision, parsed.notes);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error deciding this contract.' }, { status: 500 });
  }
}
