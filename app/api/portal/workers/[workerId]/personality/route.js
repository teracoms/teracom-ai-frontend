import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerPersonality, updateWorkerPersonality } from '@/lib/api/workerPersonality';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for the real GET/PATCH /workers/{id}/personality pair
// (teracom-ai-backend 428b3b2), mirroring
// app/api/portal/vendor-sources/route.js's own error-shape convention.
export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchWorkerPersonality(token, params.workerId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error loading this personality profile.' }, { status: 500 });
  }
}

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

  try {
    const data = await updateWorkerPersonality(token, params.workerId, payload);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Unexpected error saving this personality profile.' }, { status: 500 });
  }
}
