// Server-only Organisation Membership data access.
// ORG002 -- "Profile -> Organisations -> Switch Organisation." See
// teracom-ai-backend models/organisation_membership.py's own docstring:
// switching is a real, membership-checked update to the same
// User.organisation_id/role every existing route already reads live,
// not a second identity/session mechanism.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/organisationMemberships.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchMyOrganisationMemberships(token) {
  return backendFetch('/organisation-memberships/', { token });
}

export async function switchOrganisation(token, organisationId) {
  return backendFetch('/organisation-memberships/switch', {
    method: 'POST',
    token,
    body: { organisation_id: organisationId },
  });
}

export async function grantOrganisationMembership(token, email, role) {
  return backendFetch('/organisation-memberships/', {
    method: 'POST',
    token,
    body: { email, role },
  });
}

export async function revokeOrganisationMembership(token, membershipId) {
  return backendFetch(`/organisation-memberships/${membershipId}`, { method: 'DELETE', token });
}
