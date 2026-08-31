import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { scanVendorSource } from '@/lib/api/vendorSources';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for VendorSourceListView's "Scan Now" button ->
// POST /vendor-sources/{id}/scan.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await scanVendorSource(token, params.id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error scanning this vendor source.' }, { status: 500 });
  }
}
