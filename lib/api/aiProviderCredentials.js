// Server-only AI Provider Credential data access.
// MODELROUTE1 -- customer-supplied cloud AI provider API keys. Every
// response shape here has no field for the key at all, not even a
// masked one -- see teracom-ai-backend schemas/ai_provider_credential.py.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/aiProviderCredentials.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchAIProviderCredentials(token) {
  return backendFetch('/ai-provider-credentials/', { token });
}

export async function setAIProviderCredential(token, provider, apiKey) {
  return backendFetch(`/ai-provider-credentials/${provider}`, {
    method: 'PUT',
    token,
    body: { api_key: apiKey },
  });
}

export async function testAIProviderCredential(token, provider) {
  return backendFetch(`/ai-provider-credentials/${provider}/test`, { method: 'POST', token });
}

// CLOUD_PROVIDER_GUI_LIFECYCLE_V1 -- the real "Enable Provider"/
// "Disable Provider" action, distinct from adding/removing a key.
export async function setAIProviderCredentialEnabled(token, provider, enabled) {
  return backendFetch(`/ai-provider-credentials/${provider}/enabled`, {
    method: 'PATCH',
    token,
    body: { enabled },
  });
}

export async function deleteAIProviderCredential(token, provider) {
  return backendFetch(`/ai-provider-credentials/${provider}`, { method: 'DELETE', token });
}
