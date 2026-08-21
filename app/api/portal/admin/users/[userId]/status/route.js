import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { updateUserStatus } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { parseUserStatusUpdatePayload } from '@/lib/api/validation';

// Same-origin proxy for UserRoleStatusControl → PATCH /users/{id}/status.
// Admin-gated and self-action-guarded backend-side — this route doesn't
// duplicate either check, it only proxies and maps the resulting ApiError.
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

  const parsed = parseUserStatusUpdatePayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'A status of "active" or "inactive" is required.' },
      { status: 400 }
    );
  }

  try {
    const user = await updateUserStatus(token, params.userId, parsed.status);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unexpected error updating this user's status." }, { status: 500 });
  }
}
