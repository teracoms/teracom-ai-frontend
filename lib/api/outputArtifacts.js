// Server-only Output Artifact access, per OUTPUT_REPOSITORY_IMPLEMENTATION_V1
// -- wraps teracom-ai-backend's api/output_artifacts.py.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/outputArtifacts.js must only be used on the server.');
}

import { backendFetch } from './client.js';

// Latest version of each output by default; pass allVersions=true for
// full history across every output_key in the project.
export async function fetchProjectOutputs(token, projectId, { allVersions = false } = {}) {
  return backendFetch(`/projects/${projectId}/outputs`, {
    token,
    searchParams: allVersions ? { all_versions: 'true' } : undefined,
  });
}

export async function fetchOutputVersions(token, projectId, outputId) {
  return backendFetch(`/projects/${projectId}/outputs/${outputId}/versions`, { token });
}

// Multipart -- output_key, artifact_type, description?, file.
export async function uploadProjectOutput(token, projectId, formData) {
  return backendFetch(`/projects/${projectId}/outputs`, { method: 'POST', token, body: formData });
}

export async function fetchStorageUsage(token) {
  return backendFetch('/organisations/storage-usage', { token });
}
