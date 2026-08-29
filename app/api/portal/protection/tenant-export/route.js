import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchTenantExport } from '@/lib/api/protection';

// PLATFORM_PROTECTION_CAPABILITY_V1 -- same-origin proxy for the
// admin-only, self-service "download my organisation's data" action ->
// GET /protection/tenant-export. Always the caller's own organisation
// (no parameter accepted), same posture as every other Protection route.
// Served with Content-Disposition: attachment so a plain <a download>
// link on the Protection page triggers a real file save, not an inline
// render of a potentially large JSON payload.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchTenantExport(token);
    const filename = `${data.organisation_id}-export-${data.exported_at.slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error exporting this organisation\'s data.' }, { status: 500 });
  }
}
