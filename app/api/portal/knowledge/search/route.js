import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { semanticSearch } from '@/lib/api/knowledge';
import { ApiError } from '@/lib/api/client';
import { parseSearchQuery } from '@/lib/api/validation';

// Same-origin proxy for KnowledgeSearch → POST /search/ (Chroma semantic
// search, scoped to the caller's organisation server-side).
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

  const parsed = parseSearchQuery(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'Enter a search query.' }, { status: 400 });
  }

  try {
    const data = await semanticSearch(token, parsed.query);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error searching your knowledge base.' }, { status: 500 });
  }
}
