import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { consultFederation } from '@/lib/api/federationConsultation';
import { parseFederationConsultPayload } from '@/lib/api/validation';

// Same-origin proxy for FederationConsultationPanel's "Consult Federation"
// action → POST /federation/consult. Calling this at all IS the human's
// explicit confirmation. The "federation response" is generated locally
// via a real Ollama call and always marked is_simulated backend-side — no
// real external provider call exists anywhere in this system.
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

  const parsed = parseFederationConsultPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A worker and message are both required.' }, { status: 400 });
  }

  try {
    const data = await consultFederation(token, {
      worker_id: parsed.worker_id,
      message: parsed.message,
      federation_provider_id: parsed.federation_provider_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error consulting federation.' }, { status: 500 });
  }
}
