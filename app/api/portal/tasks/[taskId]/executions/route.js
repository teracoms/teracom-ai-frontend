import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchTaskExecutions } from '@/lib/api/tasks';

// Same-origin proxy for TaskPanel's execution history -> GET
// /tasks/{id}/executions. Read access mirrors ordinary task reads —
// any authenticated org member may see a task's execution history.
export async function GET(_request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchTaskExecutions(token, params.taskId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading this task\'s execution history.' }, { status: 500 });
  }
}
