// Server-only organisation-settings data access. New in Phase 0
// Package L (Federation Registry & External AI Consulting) — the
// federation_enabled governance-control toggle (objective #6).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/organisations.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function setFederationEnabled(token, enabled) {
  return backendFetch('/organisations/federation-enabled', {
    method: 'PATCH',
    token,
    body: { federation_enabled: enabled },
  });
}

// CUSTOMER_UX_ACCEPTANCE_V1 -- "Internal Only / Internal + Internet /
// External Providers." Richer successor to setFederationEnabled above;
// see schemas/organisation.py's FederationModeUpdate for the valid values.
export async function setFederationMode(token, mode) {
  return backendFetch('/organisations/federation-mode', {
    method: 'PATCH',
    token,
    body: { federation_mode: mode },
  });
}

// The full list — the caller's own organisation plus any sub-organisation
// created under it (parent_organisation_id). Distinct from
// lib/api/dashboard.js#fetchOrganisationSummary, which deliberately keeps
// only organisations[0] for the dashboard's single-org widget.
export async function fetchOrganisations(token) {
  return backendFetch('/organisations/', { token });
}

export async function createOrganisation(token, payload) {
  return backendFetch('/organisations/', { method: 'POST', token, body: payload });
}
