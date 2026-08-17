// Server-only deployment record data access, per Phase 0 Package PQR
// (Production Operations Platform). A two-step gate, mirroring
// Package K's MediaCentreItem publish gate — no code path anywhere
// touches real infrastructure; this is a recorded row through a
// human-gated workflow.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/deploymentRecords.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function submitDeploymentRecord(token, payload) {
  return backendFetch('/deployment-records/', { method: 'POST', token, body: payload });
}

export async function decideDeploymentRecord(token, recordId, decision, notes) {
  return backendFetch(`/deployment-records/${recordId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

export async function completeDeploymentRecord(token, recordId) {
  return backendFetch(`/deployment-records/${recordId}/complete`, { method: 'POST', token });
}

export async function fetchDeploymentRecords(token) {
  return backendFetch('/deployment-records/', { token });
}
