import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchValidateRestore } from '@/lib/api/protection';

// TERACOM_PROTECTION_PLATFORM_V1 (SD-041) -- read-only dry-run report;
// the backend route itself never writes a row for this action.
export async function POST(_request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await fetchValidateRestore(token, id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error validating this restore.' }, { status: 500 });
  }
}
