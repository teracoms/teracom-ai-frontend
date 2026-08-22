import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { deselectExecutiveRole } from '@/lib/api/executiveRoles';

// Same-origin proxy for CUSTOMER_ONBOARDING_WIZARD_V1.md Step 3 ->
// DELETE /executive-roles/{role_key}. Admin-gated backend-side.
export async function DELETE(request, { params }) {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await deselectExecutiveRole(token, params.roleKey);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error removing this executive role.' }, { status: 500 });
  }
}
