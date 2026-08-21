import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createOrganisation } from '@/lib/api/organisations';
import { parseOrganisationPayload } from '@/lib/api/validation';

// Same-origin proxy for CreateSubOrganisationForm → POST /organisations/.
// Admin-gated backend-side (require_role("admin")) — creates a
// sub-organisation linked to the caller's own organisation
// (parent_organisation_id), not an independent one (that's POST /signup).
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

  const parsed = parseOrganisationPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A name and slug are required.' }, { status: 400 });
  }

  try {
    const data = await createOrganisation(token, { name: parsed.name, slug: parsed.slug });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this organisation.' }, { status: 500 });
  }
}
