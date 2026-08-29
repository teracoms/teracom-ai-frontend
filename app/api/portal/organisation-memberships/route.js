import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchMyOrganisationMemberships, grantOrganisationMembership } from '@/lib/api/organisationMemberships';

// Same-origin proxy for Profile -> Organisations.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchMyOrganisationMemberships(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading your organisations.' }, { status: 500 });
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

  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const role = typeof payload?.role === 'string' ? payload.role.trim() : '';

  if (!email || !role) {
    return NextResponse.json({ error: 'An email and role are required.' }, { status: 400 });
  }

  try {
    const data = await grantOrganisationMembership(token, email, role);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error granting this membership.' }, { status: 500 });
  }
}
