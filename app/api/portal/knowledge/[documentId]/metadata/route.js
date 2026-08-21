import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateKnowledgeMetadata } from '@/lib/api/knowledge';
import { parseKnowledgeMetadataPayload } from '@/lib/api/validation';

// Same-origin proxy for KnowledgeMetadataForm → PATCH /knowledge/{id}/metadata.
// Admin-gated backend-side — this route doesn't duplicate that check, it
// only proxies and maps the resulting ApiError.
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

  const parsed = parseKnowledgeMetadataPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'At least one of document_type, sensitivity_level, or tags is required.' },
      { status: 400 }
    );
  }

  try {
    const data = await updateKnowledgeMetadata(token, params.documentId, {
      document_type: parsed.document_type,
      sensitivity_level: parsed.sensitivity_level,
      tags: parsed.tags,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this document's metadata." }, { status: 500 });
  }
}
