import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { uploadWorkerAvatarImage, clearWorkerAvatarImage } from '@/lib/api/workerPersonality';
import { ApiError } from '@/lib/api/client';
import { BACKEND_API_URL } from '@/lib/config';

// Same FormData-passthrough (POST) / binary-streaming (GET) / DELETE
// pattern as app/api/portal/executive-roles/[roleKey]/avatar/route.js,
// keyed by worker_id instead of role_key. POST/DELETE are admin-gated
// backend-side (services/worker_personality_service.py#set_avatar_image()/
// clear_avatar_image()).
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

  // Real backend field name -- api/workers.py's own
  // upload_worker_avatar_image_route() takes `image: UploadFile`, not
  // `file` (the executive-roles avatar route's own, different field
  // name for a different real endpoint).
  const file = formData.get('image');
  if (!file || typeof file === 'string' || !file.name) {
    return NextResponse.json({ error: 'Choose an image file to upload.' }, { status: 400 });
  }

  try {
    const result = await uploadWorkerAvatarImage(token, params.workerId, formData);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error uploading this avatar image.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await clearWorkerAvatarImage(token, params.workerId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error removing this avatar image.' }, { status: 500 });
  }
}

// Binary passthrough -- fetched directly (not via backendFetch, which
// assumes a JSON body) since the backend returns the raw image bytes
// (FileResponse), identical reasoning to the executive-roles avatar route.
export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let backendResponse;
  try {
    backendResponse = await fetch(`${BACKEND_API_URL}/workers/${params.workerId}/personality/avatar-image`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to reach the Teracom AI backend.' }, { status: 502 });
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { error: backendResponse.status === 404 ? 'No avatar image has been uploaded.' : 'Unable to load avatar image.' },
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
