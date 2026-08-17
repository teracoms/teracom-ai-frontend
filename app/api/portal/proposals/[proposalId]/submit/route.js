import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitDraftedProposal } from '@/lib/api/dealDocuments';

// Same-origin proxy for DealDocumentPanel's "Submit for Approval" action
// (on an AI-drafted proposal) → POST /proposals/{id}/submit.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await submitDraftedProposal(token, params.proposalId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this proposal.' }, { status: 500 });
  }
}
