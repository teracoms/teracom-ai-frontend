import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setOrganisationGovernanceRule } from '@/lib/api/governancePolicies';
import { parseGovernanceRuleSetPayload } from '@/lib/api/validation';

// Same-origin proxy for GovernanceRuleForm → POST /governance-rules/organisation.
// Admin-gated backend-side — this route doesn't duplicate that check, it
// only proxies and maps the resulting ApiError.
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

  const parsed = parseGovernanceRuleSetPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A rule type, a rule key, and a value are all required.' },
      { status: 400 }
    );
  }

  try {
    const data = await setOrganisationGovernanceRule(token, {
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

    return NextResponse.json({ error: 'Unexpected error setting this rule.' }, { status: 500 });
  }
}
