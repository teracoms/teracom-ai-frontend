import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchSecurityAuditLog } from '@/lib/api/securityEvents';

// Same-origin proxy -> GET /security/audit-log. Admin-gated
// backend-side -- this route doesn't duplicate that check, it only
// proxies and maps the resulting ApiError (same convention as
// app/api/portal/governance-rules/organisation/route.js).
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchSecurityAuditLog(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading the security audit log.' }, { status: 500 });
  }
}
