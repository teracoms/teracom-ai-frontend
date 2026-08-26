import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { uploadExecutiveRoleAvatar } from '@/lib/api/executiveRoles';
import { ApiError } from '@/lib/api/client';
import { BACKEND_API_URL } from '@/lib/config';

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Avatar Experience
// Foundation (focus area 5). Same FormData-passthrough (POST) /
// binary-streaming (GET) pattern as
// app/api/portal/organisation/logo/route.js, keyed by role_key instead
// of the organisation. POST is admin-gated backend-side.
export async function POST(request, { params }) {
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
    return NextResponse.json({ error: 'Choose an image file to upload.' }, { status: 400 });
  }

  try {
    const result = await uploadExecutiveRoleAvatar(token, params.roleKey, formData);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error uploading this avatar.' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${BACKEND_API_URL}/executive-roles/${params.roleKey}/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to reach the Teracom AI backend.' }, { status: 502 });
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { error: backendResponse.status === 404 ? 'No avatar has been uploaded.' : 'Unable to load avatar.' },
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
