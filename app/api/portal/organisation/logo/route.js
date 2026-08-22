import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { uploadOrganisationLogo } from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/client';
import { BACKEND_API_URL } from '@/lib/config';

/**
 * Same-origin proxy for the wizard's logo upload, mirroring
 * app/api/portal/knowledge/upload/route.js's own FormData-passthrough
 * pattern -- the browser's multipart body goes straight to backendFetch,
 * never re-encoded or buffered into a JSON string.
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
    return NextResponse.json({ error: 'Choose a logo file to upload.' }, { status: 400 });
  }

  try {
    const result = await uploadOrganisationLogo(token, formData);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error uploading your logo.' }, { status: 500 });
  }
}

/**
 * Streams the logo's raw bytes back to the browser -- deliberately NOT
 * going through lib/api/client.js#backendFetch, which always parses the
 * response body as JSON (would corrupt binary image data). This backend
 * binds loopback-only (see TERACOM_ENVIRONMENT_BASELINE_V1.md), so the
 * browser has no way to reach it directly; this route is the only path
 * an <img> tag can use to display a logo at all.
 */
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${BACKEND_API_URL}/organisations/logo`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to reach the Teracom AI backend.' }, { status: 502 });
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { error: backendResponse.status === 404 ? 'No logo has been uploaded.' : 'Unable to load logo.' },
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
