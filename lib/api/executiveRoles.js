// Server-only Executive Roles data access. CUSTOMER_ONBOARDING_WIZARD_V1.md
// Step 3 -- "selection of executive roles" (GET/POST /executive-roles/,
// DELETE /executive-roles/{role_key}).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/executiveRoles.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchExecutiveRoles(token) {
  return backendFetch('/executive-roles/', { token });
}

export async function selectExecutiveRole(token, roleKey) {
  return backendFetch('/executive-roles/', { method: 'POST', token, body: { role_key: roleKey } });
}

export async function deselectExecutiveRole(token, roleKey) {
  return backendFetch(`/executive-roles/${roleKey}`, { method: 'DELETE', token });
}

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Avatar Experience
// Foundation. FormData passthrough, same shape as
// lib/api/dashboard.js#uploadOrganisationLogo.
export async function uploadExecutiveRoleAvatar(token, roleKey, formData) {
  return backendFetch(`/executive-roles/${roleKey}/avatar`, { method: 'POST', token, body: formData });
}
