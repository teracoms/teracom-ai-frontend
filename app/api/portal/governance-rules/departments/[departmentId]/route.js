import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setDepartmentGovernanceOverride } from '@/lib/api/governancePolicies';
import { parseGovernanceRuleSetPayload } from '@/lib/api/validation';

// Same-origin proxy for GovernanceRuleForm →
// POST /governance-rules/departments/{department_id}. Admin-gated
// backend-side, and the department must belong to the caller's own
// organisation (get_owned_department) — both enforced backend-side,
// not duplicated here.
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

  const parsed = parseGovernanceRuleSetPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A rule type, a rule key, and a value are all required.' },
      { status: 400 }
    );
  }

  try {
    const data = await setDepartmentGovernanceOverride(token, params.departmentId, {
      rule_type: parsed.rule_type,
      rule_key: parsed.rule_key,
      rule_value: parsed.rule_value,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error setting this override.' }, { status: 500 });
  }
}
