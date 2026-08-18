// Server-only Worker Pack Provisioning data access (Phase 0 Package Q), per
// FRONTEND_ARCHITECTURE_V1.md §C.4 — the browser never calls
// BACKEND_API_URL directly. Turns a self-service Marketplace pack
// selection into real Worker rows — see
// services/worker_pack_provisioning_service.py on the backend.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/workerPackProvisioning.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function provisionWorkerPack(token, workerPackSlug) {
  return backendFetch('/worker-pack-provisioning/', {
    method: 'POST',
    token,
    body: { worker_pack_slug: workerPackSlug },
  });
}

export async function fetchProvisioningHistory(token) {
  return backendFetch('/worker-pack-provisioning/', { token });
}
