// Server-only worker data access, per FRONTEND_ARCHITECTURE_V1.md §C.7.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/workers.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchWorkerList(token) {
  return backendFetch('/worker-list/', { token });
}

export async function fetchWorkerSummary(token, workerId) {
  return backendFetch(`/worker-summary/${workerId}`, { token });
}

export async function fetchWorkerActivity(token, workerId) {
  return backendFetch(`/worker-activity/${workerId}`, { token });
}

export async function fetchWorkerKnowledge(token, workerId) {
  return backendFetch(`/worker-knowledge/${workerId}`, { token });
}

export async function fetchWorkerMemories(token, workerId) {
  return backendFetch(`/memory/${workerId}`, { token });
}

// Full org knowledge catalogue — used only as the "assign existing knowledge
// to this worker" picker source. Package 3 (Workers) does not build the
// Knowledge module's own list/upload/detail screens (Package 4's scope);
// this is the minimum read needed to make knowledge assignment functional.
export async function fetchKnowledgeCatalogue(token) {
  return backendFetch('/knowledge/', { token });
}

export async function createWorker(token, payload) {
  return backendFetch('/workers/', { method: 'POST', token, body: payload });
}

/**
 * teracom-ai-backend declares `worker_id`/`knowledge_id` as plain (non-Body)
 * parameters on these two routes, so FastAPI reads them as query parameters,
 * not a JSON body — the same quirk as POST /auth/login (see
 * FRONTEND_ARCHITECTURE_V1.md §B.5.2).
 */
export async function assignWorkerKnowledge(token, workerId, knowledgeId) {
  return backendFetch('/worker-knowledge/assign', {
    method: 'POST',
    token,
    searchParams: { worker_id: workerId, knowledge_id: knowledgeId },
  });
}

export async function removeWorkerKnowledge(token, workerId, knowledgeId) {
  return backendFetch('/worker-knowledge/remove', {
    method: 'DELETE',
    token,
    searchParams: { worker_id: workerId, knowledge_id: knowledgeId },
  });
}
