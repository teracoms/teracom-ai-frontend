import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { provisionWorkerPack } from '@/lib/api/workerPackProvisioning';

// Same-origin proxy for the Marketplace pack detail page's "Provision this
// pack" action (Phase 0 Package Q) → POST /worker-pack-provisioning/.
// Entitlement/tier checks happen backend-side
// (services/worker_pack_provisioning_service.py) — this route only
// forwards the slug and surfaces whatever 409/403/404 comes back.
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

  if (!payload || typeof payload.worker_pack_slug !== 'string' || !payload.worker_pack_slug.trim()) {
    return NextResponse.json({ error: 'worker_pack_slug is required.' }, { status: 400 });
  }

  try {
    const data = await provisionWorkerPack(token, payload.worker_pack_slug);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error provisioning this pack.' }, { status: 500 });
  }
}
