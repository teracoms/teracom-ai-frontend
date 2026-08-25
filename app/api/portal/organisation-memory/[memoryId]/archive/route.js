import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { archiveOrganisationMemory } from '@/lib/api/organisationMemory';

// CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
// §H4. Same-origin proxy for the new Archive control -> PATCH
// /organisation-memory/{id}/archive. Admin-only backend-side, matching POST
// /organisation-memory/store.
export async function PATCH(request, { params }) {
  const { memoryId } = params;
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await archiveOrganisationMemory(token, memoryId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error archiving this memory.' }, { status: 500 });
  }
}
