import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createPortalAccountForContact } from '@/lib/api/portalContactAccounts';
import { parsePortalContactAccountPayload } from '@/lib/api/validation';

// Same-origin proxy for PortalAccountPanel's "Create Portal Login" form →
// POST /crm/contacts/{id}/portal-account. Admin-only backend-side.
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

  const parsed = parsePortalContactAccountPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'An email and password are required.' }, { status: 400 });
  }

  try {
    const data = await createPortalAccountForContact(token, params.contactId, {
      email: parsed.email,
      password: parsed.password,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this portal account.' }, { status: 500 });
  }
}
