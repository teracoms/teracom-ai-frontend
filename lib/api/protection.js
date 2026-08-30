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

// TERACOM_PROTECTION_PLATFORM_V1 (SD-041) -- the encrypted, tenant-bound,
// tracked counterpart to fetchTenantExport() above. `kind` is "backup"
// (Teracom-held) or "export" (customer-downloaded); same real artifact
// and code path either way (services/tenant_backup_container_service.py).
export async function createTenantBackup(token, kind = 'backup') {
  return backendFetch('/protection/tenant-backups', { method: 'POST', token, body: { kind } });
}

export async function fetchTenantBackups(token) {
  return backendFetch('/protection/tenant-backups', { token });
}

// The backend's own response is the raw `.tprot` JSON document itself
// (not wrapped in a typed schema) -- backendFetch's own safeJsonParse()
// already returns it as a plain object, ready to re-serialise for a
// real file download.
export async function fetchTenantBackupArchive(token, backupId) {
  return backendFetch(`/protection/tenant-backups/${backupId}/download`, { token });
}

// Read-only dry-run -- no row is ever written by calling this.
export async function fetchValidateRestore(token, backupId) {
  return backendFetch(`/protection/tenant-backups/${backupId}/validate-restore`, { method: 'POST', token, body: {} });
}

// PROTECTION_OPERATIONS_V1 -- a consolidated, point-in-time report
// combining the dashboard, storage visibility, and worker-pack
// entitlement audit into one document. Admin-only, always the
// caller's own organisation.
export async function fetchProtectionReport(token) {
  return backendFetch('/protection/report', { token });
}

// Read-only -- reports which of this organisation's own currently-live
// pack-derived workers are still covered by an active licence.
export async function fetchWorkerPackEntitlementAudit(token) {
  return backendFetch('/protection/worker-pack-entitlement-audit', { token });
}

// PROTECTION_OPERATIONS_V1 -- full recovery drill history (real,
// per-table row-count comparisons), distinct from the summarised
// recovery_drill tile already on the dashboard. Admin-only, matching
// fetchBackupHistory()'s own reasoning: a drill exercises the whole
// platform's database, not this organisation's own data.
export async function fetchRecoveryDrillHistory(token) {
  return backendFetch('/protection/recovery-drill-history', { token });
}
