import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { switchOrganisation } from '@/lib/api/organisationMemberships';

// Same-origin proxy for the real "Switch Organisation" action. Does
// not touch the session cookie at all -- the existing access token's
// own `sub` claim is unaffected; the backend updates the same
// User.organisation_id/role every existing route already reads live
// on every request, so the *next* request through this same cookie
// already sees the new organisation. The caller (OrganisationsPanel)
// still does a hard reload after this succeeds, to guarantee every
// already-rendered piece of the current page (nav, org pill) picks up
// the change rather than only the next real navigation.
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

  const organisationId = typeof payload?.organisation_id === 'string' ? payload.organisation_id : '';
  if (!organisationId) {
    return NextResponse.json({ error: 'organisation_id is required.' }, { status: 400 });
  }

  try {
    const data = await switchOrganisation(token, organisationId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error switching organisations.' }, { status: 500 });
  }
}
