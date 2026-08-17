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
