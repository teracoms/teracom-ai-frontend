import { NextResponse } from 'next/server';

import { getPortalContactSession } from '@/lib/api/portalContactAuth';

export async function GET() {
  try {
    const portalContact = await getPortalContactSession();
    return NextResponse.json({ portalContact });
  } catch {
    return NextResponse.json(
      { portalContact: null, error: 'Unable to reach the Teracom AI backend.' },
      { status: 502 }
    );
  }
}
