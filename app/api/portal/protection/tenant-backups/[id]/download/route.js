import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchTenantBackupArchive } from '@/lib/api/protection';

// TERACOM_PROTECTION_PLATFORM_V1 (SD-041) -- serves the real, encrypted
// `.tprot` archive as a downloadable file. The backend itself already
// scopes this by organisation_id at the query layer (services/
// tenant_backup_container_service.py#get_tenant_backup()), so this
// route needs no additional tenant check of its own -- a 404 from the
// backend for another organisation's id passes straight through.
export async function GET(_request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const document = await fetchTenantBackupArchive(token, id);
    const filename = `${document.organisation_id}-${document.kind}-${document.created_at.slice(0, 10)}.tprot`;

    return new NextResponse(JSON.stringify(document, null, 2), {
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

    return NextResponse.json({ error: 'Unexpected error downloading this tenant backup.' }, { status: 500 });
  }
}
