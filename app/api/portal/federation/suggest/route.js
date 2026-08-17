import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { suggestFederationEscalation } from '@/lib/api/federationConsultation';
import { parseFederationSuggestPayload } from '@/lib/api/validation';

// Same-origin proxy for FederationConsultationPanel's "Check Confidence"
// action → POST /federation/suggest. Free — no Ollama call. Governance:
// "use Teracom capabilities first / consult federation only when
// confidence is insufficient or specialist expertise is required".
// `available: false` means either the tier gate or the federation_enabled
// governance toggle is off — surfaced as-is, not a degraded suggestion.
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

  const parsed = parseFederationSuggestPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A worker and message are both required.' }, { status: 400 });
  }

  try {
    const data = await suggestFederationEscalation(token, parsed.worker_id, parsed.message);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error checking federation confidence.' }, { status: 500 });
  }
}
