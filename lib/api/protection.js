// Server-only Protection access, per SEC_REM_004_AND_PROTECTION_PLATFORM_V1
// -- wraps teracom-ai-backend's api/protection.py.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/protection.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchProtectionDashboard(token) {
  return backendFetch('/protection/dashboard', { token });
}

export async function fetchStorageVisibility(token) {
  return backendFetch('/protection/storage', { token });
}

// Admin-only backend-side (require_role("admin")) -- see
// api/protection.py's own docstring for why: platform-wide backup
// history is real operational detail, not this organisation's own data.
export async function fetchBackupHistory(token) {
  return backendFetch('/protection/backup-history', { token });
}

// Admin-only. Triggers a real, whole-instance backup -- deliberately
// not framed anywhere in the UI as "back up my organisation", see
// api/protection.py's own docstring for why.
export async function triggerBackupNow(token) {
  return backendFetch('/protection/backup-history/run', { method: 'POST', token, body: {} });
}

// PLATFORM_PROTECTION_CAPABILITY_V1 -- admin-only, but genuinely
// per-organisation self-service (unlike the two above): always the
// caller's own organisation's real data, read-only, safe.
export async function fetchTenantExport(token) {
  return backendFetch('/protection/tenant-export', { token });
}
