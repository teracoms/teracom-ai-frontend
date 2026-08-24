// Server-only Worker Pool data access. MULTI_ORGANISATION_PLATFORM_V1 --
// Worker Evolution Model Phase 3 (teracom-ai-docs/TERACOM_DECISIONS.md
// SD-015/SD-016): a named group of same-role Workers inside one
// organisation only.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/workerPools.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchWorkerPools(token) {
  return backendFetch('/worker-pools/', { token });
}

export async function createWorkerPool(token, payload) {
  return backendFetch('/worker-pools/', { method: 'POST', token, body: payload });
}

// `workerPoolId: null` clears a worker's pool assignment -- backend's
// own WorkerPoolAssignment schema treats an explicit null the same
// way (services/worker_pool_service.py#assign_worker_to_pool()).
export async function assignWorkerToPool(token, workerId, workerPoolId) {
  return backendFetch(`/worker-pools/workers/${workerId}`, {
    method: 'PATCH',
    token,
    body: { worker_pool_id: workerPoolId },
  });
}
