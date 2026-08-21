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

// Admin-only, mirrors set_organisation_rule's own admin gate. Creates or
// updates the organisation-wide default for (rule_type, rule_key) — every
// department inherits this unless it has its own override.
export async function setOrganisationGovernanceRule(token, payload) {
  return backendFetch('/governance-rules/organisation', {
    method: 'POST',
    token,
    body: payload,
  });
}

// A department's own effective rules (its overrides plus whichever
// organisation defaults it hasn't overridden) — read-open, like the
// organisation-level equivalent above.
export async function fetchDepartmentGovernanceRules(token, departmentId) {
  return backendFetch(`/governance-rules/departments/${departmentId}`, { token });
}

// Admin-only. Creates or updates a department-level override for
// (rule_type, rule_key) — a real, distinct, audited event, never a silent
// divergence from the organisation default.
export async function setDepartmentGovernanceOverride(token, departmentId, payload) {
  return backendFetch(`/governance-rules/departments/${departmentId}`, {
    method: 'POST',
    token,
    body: payload,
  });
}

// Admin-only: who changed a governance rule and when. Written since GOV1
// shipped but never had a read route until now.
export async function fetchGovernanceAuditLog(token) {
  return backendFetch('/governance-rules/audit-log', { token });
}
