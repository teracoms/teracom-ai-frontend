// Server-only CRM contact data access, per Phase 0 Package J (Sales &
// Customer Success Platform). A CrmContact is tracked on one row for its
// whole life (prospect -> lead -> customer) — see
// SALES_MANAGER_WORKER_IMPLEMENTATION notes; no separate Prospect/Lead/
// Customer tables exist backend-side.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/crm.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createContact(token, payload) {
  return backendFetch('/crm/contacts/', { method: 'POST', token, body: payload });
}

export async function fetchContacts(token, stage) {
  return backendFetch('/crm/contacts/', { token, searchParams: stage ? { stage } : undefined });
}

export async function fetchContact(token, contactId) {
  return backendFetch(`/crm/contacts/${contactId}`, { token });
}

// Stage only ever moves forward (prospect -> lead -> customer) —
// teracom-ai-backend rejects a backward move with a 400.
export async function updateContactStage(token, contactId, stage) {
  return backendFetch(`/crm/contacts/${contactId}/stage`, {
    method: 'PATCH',
    token,
    body: { stage },
  });
}

export async function updateContactHealth(token, contactId, healthStatus) {
  return backendFetch(`/crm/contacts/${contactId}/health`, {
    method: 'PATCH',
    token,
    body: { health_status: healthStatus },
  });
}

// Executive visibility of pipeline and customer health (objective #9).
export async function fetchPipelineSummary(token) {
  return backendFetch('/crm/pipeline-summary', { token });
}
