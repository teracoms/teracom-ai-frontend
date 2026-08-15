import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/api/auth';

// Lets client components re-check the current session without a full page
// navigation (e.g. after a tab regains focus). Server Components should
// prefer calling getSessionUser() directly instead of fetching this route.
export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { user: null, error: 'Unable to reach the Teracom AI backend.' },
      { status: 502 }
    );
  }
}
