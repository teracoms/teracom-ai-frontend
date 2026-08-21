import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { updateUserRole } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { parseUserRoleUpdatePayload } from '@/lib/api/validation';

// Same-origin proxy for UserRoleStatusControl → PATCH /users/{id}/role.
// Admin-gated and escalation/self-action-guarded backend-side — this route
// doesn't duplicate either check, it only proxies and maps the resulting
// ApiError (a 403 from either guard passes straight through).
export async function PATCH(request, { params }) {
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

  const parsed = parseUserRoleUpdatePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A valid role (owner, admin, manager, employee, or read_only) is required.' },
      { status: 400 }
    );
  }

  try {
    const user = await updateUserRole(token, params.userId, parsed.role);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this user's role." }, { status: 500 });
  }
}
