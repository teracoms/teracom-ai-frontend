import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createKnowledge } from '@/lib/api/knowledge';
import { parseKnowledgeCreatePayload } from '@/lib/api/validation';

// Same-origin proxy for CUSTOMER_ONBOARDING_WIZARD_V1.md Step 5's
// Knowledge Setup -> POST /knowledge/. Admin-gated backend-side,
// mirrors app/api/portal/departments/route.js's own POST handler.
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

  const parsed = parseKnowledgeCreatePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'Title, content, and source are required, and document_type (if given) must be recognised.' },
      { status: 400 }
    );
  }

  try {
    const data = await createKnowledge(token, {
      organisation_id: parsed.organisation_id,
      title: parsed.title,
      content: parsed.content,
      source: parsed.source,
      document_type: parsed.document_type,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this knowledge document.' }, { status: 500 });
  }
}
