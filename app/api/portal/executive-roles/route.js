import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchExecutiveRoles, selectExecutiveRole } from '@/lib/api/executiveRoles';

// Same-origin proxy for CUSTOMER_ONBOARDING_WIZARD_V1.md Step 3's
// executive-role selection -> GET/POST /executive-roles/. GET is open
// to any signed-in role (matches the backend); POST requires an admin
// backend-side.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchExecutiveRoles(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading executive roles.' }, { status: 500 });
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

  const roleKey = typeof payload?.role_key === 'string' ? payload.role_key.trim() : '';
  if (!roleKey) {
    return NextResponse.json({ error: 'A role_key is required.' }, { status: 400 });
  }

  try {
    const data = await selectExecutiveRole(token, roleKey);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error selecting this executive role.' }, { status: 500 });
  }
}
