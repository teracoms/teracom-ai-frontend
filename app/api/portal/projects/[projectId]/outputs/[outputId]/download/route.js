import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { BACKEND_API_URL } from '@/lib/config';

/**
 * Streams the output's real stored file back, byte-for-byte -- deliberately
 * NOT going through lib/api/client.js#backendFetch, which always parses the
 * response body as JSON (would corrupt any binary artifact: DOCX, PDF,
 * images, video, ZIP, all of it). Mirrors
 * app/api/portal/organisation/logo/route.js's own GET handler exactly, the
 * proven pattern in this codebase for streaming a backend FileResponse
 * through to the browser -- this backend binds loopback-only, so this route
 * is the only path a download link can use at all. The one addition here:
 * passes through the backend's own Content-Disposition header (which
 * carries the real filename) instead of hardcoding one, since unlike a
 * logo, an output's filename is meaningful and varies per artifact.
 */
export async function GET(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let backendResponse;
  try {
    backendResponse = await fetch(
      `${BACKEND_API_URL}/projects/${params.projectId}/outputs/${params.outputId}/download`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to reach the Teracom AI backend.' }, { status: 502 });
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { error: backendResponse.status === 404 ? 'This output was not found.' : 'Unable to download this output.' },
      { status: backendResponse.status }
    );
  }

  const contentType = backendResponse.headers.get('content-type') ?? 'application/octet-stream';
  const contentDisposition = backendResponse.headers.get('content-disposition') ?? 'attachment';
  const bytes = await backendResponse.arrayBuffer();

  return new NextResponse(bytes, {
    status: 200,
    headers: { 'Content-Type': contentType, 'Content-Disposition': contentDisposition },
  });
}
