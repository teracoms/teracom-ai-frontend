// Server-only People (executive persona) access, per
// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 focus areas 2 and 3 --
// wraps teracom-ai-backend's api/people.py.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/people.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchPersonas(token) {
  return backendFetch('/people/personas', { token });
}

export async function fetchPersonaConversation(token, personaKey) {
  return backendFetch(`/people/${personaKey}/conversation`, { token });
}

export async function converseWithPersona(token, personaKey, message) {
  return backendFetch(`/people/${personaKey}/converse`, { method: 'POST', token, body: { message } });
}
