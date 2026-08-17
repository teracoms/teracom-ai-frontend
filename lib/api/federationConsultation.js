// Server-only federation consultation data access, per Phase 0 Package L
// (Federation Registry & External AI Consulting). Every "federation
// response" is generated locally via a real Ollama call and marked
// is_simulated: true backend-side — no real external provider call exists
// anywhere in this system (see docs/backend/
// PHASE_0_PACKAGE_L_FEDERATION_AND_EXTERNAL_AI_CONSULTING_IMPLEMENTATION_REPORT.md).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/federationConsultation.js must only be used on the server.');
}

import { backendFetch } from './client.js';

// Free — no Ollama call. Governance: "use Teracom capabilities first /
// consult federation only when confidence is insufficient or specialist
// expertise is required".
export async function suggestFederationEscalation(token, workerId, message) {
  return backendFetch('/federation/suggest', {
    method: 'POST',
    token,
    body: { worker_id: workerId, message },
  });
}

// The confirm action itself — calling this at all IS the human's
// explicit confirmation. `federation_provider_id` is optional.
export async function consultFederation(token, payload) {
  return backendFetch('/federation/consult', { method: 'POST', token, body: payload });
}

export async function fetchFederationConsultations(token) {
  return backendFetch('/federation/consultations', { token });
}
