import { NextResponse } from 'next/server';

import { signupTrial, fetchCurrentUser, setSessionCookie } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { parseTrialSignupPayload } from '@/lib/api/validation';

// Same-origin proxy for TrialSignupForm → POST /signup/trial, mirroring
// app/api/auth/login/route.js's own shape: on success, resolve the real
// user via GET /auth/me and set the same httpOnly session cookie login
// uses, so a trial signup lands the caller straight in the portal
// exactly like a login would.
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseTrialSignupPayload(payload);

  if (!parsed.valid) {
    return NextResponse.json(
      { error: 'Organisation name, your name, email, and a password of at least 8 characters are required.' },
      { status: 400 }
    );
  }

  try {
    const { access_token: accessToken, trial_ends_at: trialEndsAt } = await signupTrial({
      organisation_name: parsed.organisationName,
      admin_first_name: parsed.adminFirstName,
      admin_last_name: parsed.adminLastName,
      admin_email: parsed.adminEmail,
      admin_password: parsed.adminPassword,
    });

    const user = await fetchCurrentUser(accessToken);

    setSessionCookie(accessToken);

    return NextResponse.json({ user, trial_ends_at: trialEndsAt });
  } catch (error) {
    if (error instanceof ApiError) {
      const headers = {};
      if (error.details?.retryAfter) {
        headers['Retry-After'] = error.details.retryAfter;
      }
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status, headers });
    }

    return NextResponse.json({ error: 'Unexpected error starting your trial.' }, { status: 500 });
  }
}
