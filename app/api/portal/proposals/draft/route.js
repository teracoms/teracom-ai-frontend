import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { draftProposal } from '@/lib/api/dealDocuments';
import { parseProposalDraftPayload } from '@/lib/api/validation';

// Same-origin proxy for DealDocumentPanel's "Draft with AI" action →
// POST /proposals/draft. Gated backend-side by the "sales_intelligence"
// capability (Enterprise+) — a 403 here just means this organisation's
// tier doesn't include it, surfaced as-is. Produces a "draft"-status
// proposal a human must still explicitly submit.
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

  const parsed = parseProposalDraftPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A contact, worker, title, and brief are all required.' },
      { status: 400 }
    );
  }

  try {
    const data = await draftProposal(token, parsed.worker_id, {
      crm_contact_id: parsed.crm_contact_id,
      title: parsed.title,
      brief: parsed.brief,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error drafting this proposal.' }, { status: 500 });
  }
}
