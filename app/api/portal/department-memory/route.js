import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { storeDepartmentMemory } from '@/lib/api/departmentMemory';
import { parseDepartmentMemoryPayload } from '@/lib/api/validation';

// Same-origin proxy for AddDepartmentMemoryForm → POST
// /department-memory/store. Write is admin-only backend-side (read is any
// member of the owning organisation); also requires the Memory Enrichment
// capability (Enterprise+).
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

  const parsed = parseDepartmentMemoryPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A department and a memory are both required.' }, { status: 400 });
  }

  try {
    const data = await storeDepartmentMemory(token, parsed.department_id, parsed.memory);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error saving this memory.' }, { status: 500 });
  }
}
