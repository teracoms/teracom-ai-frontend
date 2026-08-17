import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitContract } from '@/lib/api/dealDocuments';
import { parseDealDocumentPayload } from '@/lib/api/validation';

// Same-origin proxy for DealDocumentPanel (kind="contract") →
// POST /contracts/. Created and submitted in one step — contracts are
// always human-entered, never AI-drafted. Governance: "all contracts
// require human approval" (and "all financial commitments require human
// approval" — a contract's own approval gate is that approval).
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

  const quoteId = typeof payload?.quote_id === 'string' && payload.quote_id.trim()
    ? payload.quote_id.trim()
    : undefined;

  try {
    const data = await submitContract(token, {
      crm_contact_id: parsed.crm_contact_id,
      quote_id: quoteId,
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

    return NextResponse.json({ error: 'Unexpected error submitting this contract.' }, { status: 500 });
  }
}
