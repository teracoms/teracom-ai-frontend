import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchTenantBackups, createTenantBackup } from '@/lib/api/protection';

// TERACOM_PROTECTION_PLATFORM_V1 (SD-041) -- same-origin proxy for the
// real, tenant-bound backup/export list and creation actions. Always
// the caller's own organisation (no parameter accepted) -- both
// backend routes are admin-gated and organisation_id-scoped, same
// posture as GET /protection/tenant-export.

export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchTenantBackups(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error listing tenant backups.' }, { status: 500 });
  }
}

export async function POST(request) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const kind = body.kind === 'export' ? 'export' : 'backup';

  try {
    const data = await createTenantBackup(token, kind);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating a tenant backup.' }, { status: 500 });
  }
}
