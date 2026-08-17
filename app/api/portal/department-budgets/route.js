import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { submitDepartmentBudget } from '@/lib/api/departmentBudgets';
import { parseDepartmentBudgetPayload } from '@/lib/api/validation';

// Same-origin proxy for DepartmentBudgetPanel → POST /department-budgets/.
// Created and submitted in one step. Any org member may submit; only an
// admin may later decide (see [budgetId]/decide) — governance: "human
// approval required for all financial commitments".
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

  const parsed = parseDepartmentBudgetPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A department, period label, and amount allocated are all required.' },
      { status: 400 }
    );
  }

  try {
    const data = await submitDepartmentBudget(token, {
      department_id: parsed.department_id,
      period_label: parsed.period_label,
      amount_allocated: parsed.amount_allocated,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error submitting this department budget.' }, { status: 500 });
  }
}
