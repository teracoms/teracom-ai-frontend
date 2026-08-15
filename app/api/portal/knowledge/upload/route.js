import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { uploadKnowledgeDocument } from '@/lib/api/knowledge';
import { ApiError } from '@/lib/api/client';

/**
 * Same-origin proxy for UploadKnowledgeForm. teracom-ai-backend's POST
 * /upload/ is multipart (`worker_id` Form field + `file` File field) — this
 * route reads the browser's multipart body via request.formData() and hands
 * the same FormData straight to backendFetch (see lib/api/client.js), rather
 * than re-encoding it, so the file bytes are never buffered into a JSON
 * string anywhere in this app.
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

  const workerId = formData.get('worker_id');
  const file = formData.get('file');

  if (typeof workerId !== 'string' || !workerId) {
    return NextResponse.json({ error: 'Choose a worker to assign this document to.' }, { status: 400 });
  }

  if (!file || typeof file === 'string' || !file.name) {
    return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
  }

  try {
    const result = await uploadKnowledgeDocument(token, formData);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error uploading this document.' }, { status: 500 });
  }
}
