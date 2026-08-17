import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitQuote } from '@/lib/api/dealDocuments';
import { parseDealDocumentPayload } from '@/lib/api/validation';

// Same-origin proxy for DealDocumentPanel (kind="quote") → POST /quotes/.
// Created and submitted in one step — quotes are always human-entered,
// never AI-drafted. Governance: "all quotes require human approval".
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

  const parsed = parseDealDocumentPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A contact, title, and content are all required.' }, { status: 400 });
  }

  const proposalId = typeof payload?.proposal_id === 'string' && payload.proposal_id.trim()
    ? payload.proposal_id.trim()
    : undefined;

  try {
    const data = await submitQuote(token, {
      crm_contact_id: parsed.crm_contact_id,
      proposal_id: proposalId,
      title: parsed.title,
      content: parsed.content,
      amount: parsed.amount,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this quote.' }, { status: 500 });
  }
}
