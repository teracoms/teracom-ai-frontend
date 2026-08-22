// Server-only -- Settings & Security V1 MFA (SETTINGS_SECURITY_V1_
// ARCHITECTURE.md §2). setupMfa/confirmMfa/disableMfa require an existing
// session (token); verifyMfaLogin is the one call in this module made
// with NO session token -- the caller has none yet, only the short-lived
// mfa_challenge_token POST /auth/login issued instead of real tokens.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/mfa.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function setupMfa(token) {
  return backendFetch('/auth/mfa/setup', { method: 'POST', token });
}

export async function confirmMfa(token, code) {
  return backendFetch('/auth/mfa/confirm', { method: 'POST', token, body: { code } });
}

export async function disableMfa(token, password, code) {
  return backendFetch('/auth/mfa/disable', { method: 'POST', token, body: { password, code } });
}

// No token -- see this module's own docstring above. `userAgent`,
// optional -- same real-browser-identity forwarding as
// lib/api/auth.js#loginWithCredentials's own userAgent parameter.
export async function verifyMfaLogin(challengeToken, code, userAgent) {
  return backendFetch('/auth/mfa/login-verify', {
    method: 'POST',
    body: { challenge_token: challengeToken, code },
    headers: userAgent ? { 'User-Agent': userAgent } : undefined,
  });
}
