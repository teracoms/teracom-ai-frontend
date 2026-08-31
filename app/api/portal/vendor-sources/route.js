import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchVendorSources, createVendorSource } from '@/lib/api/vendorSources';
import { parseVendorSourcePayload } from '@/lib/api/validation';

// Same-origin proxy for AddVendorSourceForm -> POST /vendor-sources/, and
// for VendorSourceListView's own client-side refresh -> GET /vendor-sources/.
// Admin-gated backend-side; this route only proxies and maps ApiError.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchVendorSources(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading vendor sources.' }, { status: 500 });
  }
}

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

  const parsed = parseVendorSourcePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'Vendor name, an https:// resource URL, and a worker are all required.' },
      { status: 400 }
    );
  }

  try {
    const data = await createVendorSource(token, {
      vendor_name: parsed.vendor_name,
      resource_url: parsed.resource_url,
      worker_id: parsed.worker_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this vendor source.' }, { status: 500 });
  }
}
