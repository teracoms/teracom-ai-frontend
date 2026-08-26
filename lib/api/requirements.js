// Server-only Requirements Engine access, per
// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 focus area 1 -- wraps
// teracom-ai-backend's api/requirements.py. Same version/is_latest shape
// as lib/api/outputArtifacts.js's own OutputArtifact wrapper.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/requirements.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchLatestRequirements(token, projectId) {
  return backendFetch(`/projects/${projectId}/requirements`, { token });
}

export async function fetchRequirementsVersions(token, projectId) {
  return backendFetch(`/projects/${projectId}/requirements/versions`, { token });
}

export async function generateRequirements(token, projectId) {
  return backendFetch(`/projects/${projectId}/requirements/generate`, { method: 'POST', token });
}

export async function updateRequirementsContent(token, projectId, content) {
  return backendFetch(`/projects/${projectId}/requirements`, { method: 'PATCH', token, body: { content } });
}

export async function updateRequirementsStatus(token, projectId, status) {
  return backendFetch(`/projects/${projectId}/requirements/status`, { method: 'PATCH', token, body: { status } });
}
