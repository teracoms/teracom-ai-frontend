import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@/lib/api/auth';

// teracom-ai-backend has no token-revocation endpoint (§B.5.3 of
// FRONTEND_ARCHITECTURE_V1.md) — logout only clears the local session cookie.
// The JWT itself remains technically valid until its natural (60-minute)
// expiry. Acceptable for V1 given the short token lifetime; flagged as a
// backend follow-up in AUTHENTICATION_IMPLEMENTATION_REPORT.md.
export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
