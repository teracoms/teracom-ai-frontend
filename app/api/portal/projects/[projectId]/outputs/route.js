import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { fetchProjectOutputs, uploadProjectOutput } from '@/lib/api/outputArtifacts';
import { ApiError } from '@/lib/api/client';

export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const allVersions = new URL(request.url).searchParams.get('all_versions') === 'true';

  try {
    const data = await fetchProjectOutputs(token, params.projectId, { allVersions });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to load this project\'s outputs.' }, { status: 500 });
  }
}

// Multipart passthrough, same FormData-straight-through pattern
// app/api/portal/knowledge/upload/route.js already established -- the
// file's bytes are never buffered into a JSON string anywhere in this
// app.
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
  const outputKey = formData.get('output_key');

  if (!file || typeof file === 'string' || !file.name) {
    return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
  }
  if (typeof outputKey !== 'string' || !outputKey.trim()) {
    return NextResponse.json({ error: 'Give this output a name.' }, { status: 400 });
  }

  try {
    const result = await uploadProjectOutput(token, params.projectId, formData);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unable to upload this output.' }, { status: 500 });
  }
}
