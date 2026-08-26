import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { triggerBackupNow } from '@/lib/api/protection';

// SEC_REM_004_AND_PROTECTION_PLATFORM_V1 -- same-origin proxy for the
// admin-only "Run backup now" action -> POST /protection/backup-history/run.
// Admin-only backend-side; see lib/api/protection.js's own comment for
// why this is deliberately not framed as a per-organisation action.
export async function POST() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await triggerBackupNow(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error triggering this backup.' }, { status: 500 });
  }
}
