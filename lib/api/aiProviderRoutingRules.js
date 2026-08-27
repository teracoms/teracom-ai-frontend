// Server-only AI Provider Routing Rules data access.
// MODELROUTE1 -- Mode D (Custom Routing)'s real, stored, ordered
// fallback list. v1 is a single organisation-wide list (purpose
// always null) -- see teracom-ai-backend
// schemas/ai_provider_routing_rule.py.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/aiProviderRoutingRules.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchAIProviderRoutingRules(token) {
  return backendFetch('/ai-provider-routing-rules/', { token });
}

export async function replaceAIProviderRoutingRules(token, rules) {
  return backendFetch('/ai-provider-routing-rules/', { method: 'PUT', token, body: { rules } });
}
