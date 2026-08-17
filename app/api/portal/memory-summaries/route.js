import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { generateMemorySummary } from '@/lib/api/memorySummaries';
import { parseMemorySummaryRequestPayload } from '@/lib/api/validation';

// Same-origin proxy for MemorySummaryPanel's "Generate Summary" action →
// POST /memory-summaries/generate. Access is gated backend-side identically
// to that scope's own read rule (organisation: admin-only; department: any
// org member; worker: existing ownership check), plus the Memory
// Enrichment capability (Enterprise+). This makes a real Ollama call and
// persists a new summary row — it never edits or deletes any raw memory.
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

  const parsed = parseMemorySummaryRequestPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A valid scope and scope_id are required.' }, { status: 400 });
  }

  try {
    const data = await generateMemorySummary(token, parsed.scope, parsed.scope_id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error generating this summary.' }, { status: 500 });
  }
}
