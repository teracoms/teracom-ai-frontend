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
