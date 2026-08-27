// Server-only Model Economics Director data access.
// MODELROUTE1 Phase 5 -- real cost/latency/availability comparison,
// never a fabricated quality score. See teracom-ai-backend
// services/model_economics_service.py's own module docstring.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/modelEconomics.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchModelEconomicsComparison(token) {
  return backendFetch('/model-economics/comparison', { token });
}
