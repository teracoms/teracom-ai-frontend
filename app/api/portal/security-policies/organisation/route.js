import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchOrganisationSecurityPolicy, setOrganisationSecurityRule } from '@/lib/api/securityPolicies';
import { parseSecurityPolicyPayload } from '@/lib/api/validation';

// Same-origin proxy for SecurityPolicyForm.js (Organisation Security) ->
// GET/POST /governance-rules/organisation with rule_type="security"
// pre-filled (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.6). POST is
// admin-gated backend-side.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchOrganisationSecurityPolicy(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading your organisation security policy.' }, { status: 500 });
  }
}

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

  const parsed = parseSecurityPolicyPayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'A recognised security rule_key and a valid value are required.' }, { status: 400 });
  }

  try {
    const data = await setOrganisationSecurityRule(token, parsed.rule_key, parsed.rule_value);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error setting this security policy.' }, { status: 500 });
  }
}
