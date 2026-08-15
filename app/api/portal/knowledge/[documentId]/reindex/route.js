import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { reindexDocument } from '@/lib/api/knowledge';
import { ApiError } from '@/lib/api/client';

// Same-origin proxy for DocumentActions' reindex button → POST /documents/reindex/{id}.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await reindexDocument(token, params.documentId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error reindexing this document.' }, { status: 500 });
  }
}
