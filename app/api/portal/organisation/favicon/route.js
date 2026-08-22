import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { uploadOrganisationFavicon } from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/client';
import { BACKEND_API_URL } from '@/lib/config';

/**
 * Same-origin proxy for the wizard's favicon upload -- mirrors
 * app/api/portal/organisation/logo/route.js's own FormData-passthrough
 * pattern exactly (the backend's _upload_branding_asset helper backs both
 * logo and favicon uploads identically).
 */
export async function POST(request) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string' || !file.name) {
    return NextResponse.json({ error: 'Choose a favicon file to upload.' }, { status: 400 });
  }

  try {
    const result = await uploadOrganisationFavicon(token, formData);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error uploading your favicon.' }, { status: 500 });
  }
}

/**
 * Streams the favicon's raw bytes back to the browser -- deliberately NOT
 * going through lib/api/client.js#backendFetch (JSON-only, would corrupt
 * binary image data). Mirrors the logo route's GET handler exactly.
 */
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${BACKEND_API_URL}/organisations/favicon`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to reach the Teracom AI backend.' }, { status: 502 });
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { error: backendResponse.status === 404 ? 'No favicon has been uploaded.' : 'Unable to load favicon.' },
      { status: backendResponse.status }
    );
  }

  const contentType = backendResponse.headers.get('content-type') ?? 'application/octet-stream';
  const bytes = await backendResponse.arrayBuffer();

  return new NextResponse(bytes, {
    status: 200,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=300' },
  });
}
