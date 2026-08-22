// Server-only -- Settings & Security V1 Active Sessions
// (SETTINGS_SECURITY_V1_ARCHITECTURE.md §3). `currentRefreshToken` is the
// caller's own raw refresh token, sent only so the backend can flag which
// row is the current session -- never redeemed, never logged.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/sessions.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchSessions(token, currentRefreshToken) {
  return backendFetch('/auth/sessions', {
    token,
    searchParams: currentRefreshToken ? { current_refresh_token: currentRefreshToken } : undefined,
  });
}

export async function revokeSession(token, sessionId) {
  return backendFetch(`/auth/sessions/${sessionId}/revoke`, { method: 'POST', token });
}

export async function revokeOtherSessions(token, currentRefreshToken) {
  return backendFetch('/auth/sessions/revoke-others', {
    method: 'POST',
    token,
    searchParams: currentRefreshToken ? { current_refresh_token: currentRefreshToken } : undefined,
  });
}
