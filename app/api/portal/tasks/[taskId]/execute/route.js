import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { executeTask } from '@/lib/api/tasks';

// Same-origin proxy for TaskPanel's Execute action -> POST
// /tasks/{id}/execute. Backend-gated at admin tier (require_role("admin")),
// deliberately stricter than every other route this repo proxies for
// tasks — this frontend does not loosen that, the backend 403 (surfaced
// as-is below) is the real enforcement.
export async function POST(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await executeTask(token, params.taskId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error executing this task.' }, { status: 500 });
  }
}
