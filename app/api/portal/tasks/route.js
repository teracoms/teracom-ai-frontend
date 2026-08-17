import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { createTask } from '@/lib/api/tasks';
import { parseTaskPayload } from '@/lib/api/validation';

// Same-origin proxy for TaskPanel → POST /tasks/. Ungated backend-side —
// any org member may create a task.
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

  const parsed = parseTaskPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A project and task title are required.' }, { status: 400 });
  }

  try {
    const data = await createTask(token, {
      project_id: parsed.project_id,
      title: parsed.title,
      description: parsed.description,
      assignee_worker_id: parsed.assignee_worker_id,
      due_date: parsed.due_date,
      priority: parsed.priority,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this task.' }, { status: 500 });
  }
}
