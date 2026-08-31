import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateVendorSource } from '@/lib/api/vendorSources';
import { parseVendorSourceUpdatePayload } from '@/lib/api/validation';

// Same-origin proxy for the shared edit / enable-disable / schedule-change /
// remove action -> PATCH /vendor-sources/{id}. One route backs all four GUI
// actions, mirroring the backend's own single endpoint.
export async function PATCH(request, { params }) {
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

  const parsed = parseVendorSourceUpdatePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'No valid fields to update were provided.' }, { status: 400 });
  }

  const { valid, ...fields } = parsed;

  try {
    const data = await updateVendorSource(token, params.id, fields);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error updating this vendor source.' }, { status: 500 });
  }
}
