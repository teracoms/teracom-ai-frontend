import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { createUser } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { parseUserPayload } from '@/lib/api/validation';

// Same-origin proxy for CreateUserForm — POST /users/ is admin-gated
// backend-side (require_role("admin")), a real enforcement boundary here
// (unlike most create endpoints in this app) — this route doesn't duplicate
// that check, it only proxies and maps the resulting ApiError.
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

  const parsed = parseUserPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'First name, last name, email and password are all required.' },
      { status: 400 }
    );
  }

  try {
    const user = await createUser(token, {
      organisation_id: parsed.organisation_id,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      email: parsed.email,
      password_hash: parsed.password,
      role: parsed.role,
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error creating this user.' }, { status: 500 });
  }
}
