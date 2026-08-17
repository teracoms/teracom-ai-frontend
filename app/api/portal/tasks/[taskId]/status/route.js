import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { updateTaskStatus } from '@/lib/api/tasks';
import { parseTaskStatusPayload } from '@/lib/api/validation';

// Same-origin proxy for TaskPanel's status control → PATCH
// /tasks/{id}/status. Ungated backend-side — any org member may change a
// task's status.
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

  const parsed = parseTaskStatusPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A status of "pending", "in_progress", or "done" is required.' }, { status: 400 });
  }

  try {
    const data = await updateTaskStatus(token, params.taskId, parsed.status);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this task's status." }, { status: 500 });
  }
}
