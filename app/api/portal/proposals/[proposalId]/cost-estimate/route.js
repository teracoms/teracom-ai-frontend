import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setProposalCostEstimate } from '@/lib/api/dealDocuments';
import { parseProposalCostEstimatePayload } from '@/lib/api/validation';

// Same-origin proxy for DealDocumentPanel's internal-cost-estimate field
// (kind="proposal") → PATCH /proposals/{id}/cost-estimate. Not a pricing
// decision, so no admin gate backend-side — any org member may set it.
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

  const parsed = parseProposalCostEstimatePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A numeric internal_cost_estimate is required.' }, { status: 400 });
  }

  try {
    const data = await setProposalCostEstimate(token, params.proposalId, parsed.internal_cost_estimate);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this proposal's cost estimate." }, { status: 500 });
  }
}
