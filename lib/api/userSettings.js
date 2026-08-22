// Server-only User Settings access -- Settings & Security V1
// (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.1/§1.5/§5). Profile, Theme,
// Notifications, Timezone, Accessibility, Dashboard Preferences all live
// in this one backend resource (GET/PATCH /users/me/settings).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/userSettings.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchUserSettings(token) {
  return backendFetch('/users/me/settings', { token });
}

export async function updateUserSettings(token, payload) {
  return backendFetch('/users/me/settings', {
    method: 'PATCH',
    token,
    body: payload,
  });
}
