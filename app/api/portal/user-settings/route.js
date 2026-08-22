import { NextResponse } from 'next/server';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchUserSettings, updateUserSettings } from '@/lib/api/userSettings';
import { parseUserSettingsUpdatePayload } from '@/lib/api/validation';

// Same-origin proxy for Settings & Security V1's User Settings page ->
// GET/PATCH /users/me/settings.
export async function GET() {
  const token = getSessionToken();

  if (!token) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  try {
    const data = await fetchUserSettings(token);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error loading your settings.' }, { status: 500 });
  }
}

export async function PATCH(request) {
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

  const parsed = parseUserSettingsUpdatePayload(payload);
  if (!parsed.valid) {
    return NextResponse.json({ error: 'No recognised settings fields were supplied.' }, { status: 400 });
  }

  const body = {};
  if (parsed.first_name !== undefined) body.first_name = parsed.first_name;
  if (parsed.last_name !== undefined) body.last_name = parsed.last_name;
  if (parsed.timezone !== undefined) body.timezone = parsed.timezone;
  if (parsed.preferences !== undefined) body.preferences = parsed.preferences;

  try {
    const data = await updateUserSettings(token, body);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status === 0 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Unexpected error saving your settings.' }, { status: 500 });
  }
}
