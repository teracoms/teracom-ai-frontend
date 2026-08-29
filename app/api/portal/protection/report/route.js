import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchProtectionReport } from '@/lib/api/protection';

// PROTECTION_OPERATIONS_V1 -- same-origin download proxy for the
// consolidated Protection Report, mirroring the tenant-export route's
// own Content-Disposition pattern exactly. Always the caller's own
// organisation.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchProtectionReport(token);
    const filename = `${data.organisation_id}-protection-report-${data.generated_at.slice(0, 10)}.json`;

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

    return NextResponse.json({ error: 'Unexpected error generating this report.' }, { status: 500 });
  }
}
