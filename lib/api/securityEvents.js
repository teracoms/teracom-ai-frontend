// Server-only -- Settings & Security V1 Login History and (the
// SecurityEventLog half of) Audit Controls
// (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.4).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/securityEvents.js must only be used on the server.');
}

import { backendFetch } from './client.js';

// Self-view only -- the caller's own login_success/login_failed events.
export async function fetchLoginHistory(token) {
  return backendFetch('/security/login-history', { token });
}

// Admin-only, org-wide, every event type -- combine with
// lib/api/governancePolicies.js#fetchGovernanceAuditLog (filtered to
// rule_type="security") for the full Audit Controls timeline; these are
// two distinct backend tables, not one merged endpoint.
export async function fetchSecurityAuditLog(token) {
  return backendFetch('/security/audit-log', { token });
}
