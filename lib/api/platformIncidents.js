// Server-only platform incident data access, per Phase 0 Package PQR
// (Production Operations Platform). Ungated — any org member, mirrors
// Package N's Task posture (operational tracking, not a commitment).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/platformIncidents.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createPlatformIncident(token, payload) {
  return backendFetch('/platform-incidents/', { method: 'POST', token, body: payload });
}

export async function updatePlatformIncidentStatus(token, incidentId, status) {
  return backendFetch(`/platform-incidents/${incidentId}/status`, { method: 'PATCH', token, body: { status } });
}

export async function fetchPlatformIncidents(token) {
  return backendFetch('/platform-incidents/', { token });
}
