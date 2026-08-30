// Server-only AI Provider Configuration data access.
// MULTI_ORGANISATION_PLATFORM_V1 -- the real, organisation-scoped
// embodiment of "Worker != AI Model"
// (teracom-ai-docs/TERACOM_DECISIONS.md SD-015/SD-016): a Worker
// represents an organisational role, never a specific AI model.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/aiProviderConfig.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchAIProviderConfig(token) {
  return backendFetch('/ai-provider-config/', { token });
}

export async function setAIProviderConfig(token, payload) {
  return backendFetch('/ai-provider-config/', { method: 'PUT', token, body: payload });
}

// FEDERATION_AND_LOCAL_LLM_V1 -- real, live health + real, historical
// availability for every provider this platform knows the name of.
export async function fetchProviderHealth(token) {
  return backendFetch('/ai-provider-config/health', { token });
}
