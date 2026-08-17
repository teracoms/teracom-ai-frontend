import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createContact } from '@/lib/api/crm';
import { parseContactIntakePayload } from '@/lib/api/validation';

// Same-origin proxy for ContactIntakeForm → POST /crm/contacts/. Prospect
// intake (Phase 0 Package J, objective #4) — any authenticated org member.
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

  const parsed = parseContactIntakePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A contact name is required.' }, { status: 400 });
  }

  try {
    const data = await createContact(token, {
      name: parsed.name,
      company: parsed.company,
      email: parsed.email,
      phone: parsed.phone,
      source: parsed.source,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this contact.' }, { status: 500 });
  }
}
