// Server-only worker creation request data access, per Phase 0
// Package PQR (Worker Lifecycle & Governance). A second, optional
// path to a real Worker, alongside the pre-existing direct admin
// creation (POST /workers/, unchanged).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/workerCreationRequests.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function submitWorkerCreationRequest(token, payload) {
  return backendFetch('/worker-creation-requests/', { method: 'POST', token, body: payload });
}

export async function decideWorkerCreationRequest(token, requestId, decision, notes) {
  return backendFetch(`/worker-creation-requests/${requestId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

export async function fetchWorkerCreationRequests(token) {
  return backendFetch('/worker-creation-requests/', { token });
}
