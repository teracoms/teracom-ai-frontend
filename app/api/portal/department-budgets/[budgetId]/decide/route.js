import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { decideDepartmentBudget } from '@/lib/api/departmentBudgets';
import { parseDealDecisionPayload } from '@/lib/api/validation';

// Same-origin proxy for DepartmentBudgetPanel's approve/reject action →
// POST /department-budgets/{id}/decide. Admin-gated backend-side — the
// human approval governance rule this route exists to enforce.
export async function POST(request, { params }) {
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

  const parsed = parseDealDecisionPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json({ error: 'A decision of "approved" or "rejected" is required.' }, { status: 400 });
  }

  try {
    const data = await decideDepartmentBudget(token, params.budgetId, parsed.decision, parsed.notes);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error deciding this department budget.' }, { status: 500 });
  }
}
