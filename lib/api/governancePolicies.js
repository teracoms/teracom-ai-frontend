// Server-only governance policy registry access, per Phase 0 Package
// PQR — organisation policy visibility (objective #7).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/governancePolicies.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchGovernancePolicies(token) {
  return backendFetch('/governance-policies/', { token });
}

// Package GOV1's own cascade rules — real organisation-level defaults and
// department overrides, distinct from the static role registry above.
export async function fetchOrganisationGovernanceRules(token) {
  return backendFetch('/governance-rules/organisation', { token });
}

// Admin-only: who changed a governance rule and when. Written since GOV1
// shipped but never had a read route until now.
export async function fetchGovernanceAuditLog(token) {
  return backendFetch('/governance-rules/audit-log', { token });
}
