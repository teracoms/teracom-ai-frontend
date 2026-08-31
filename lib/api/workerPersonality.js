// Server-only worker personality/avatar/voice data access, mirroring
// lib/api/vendorSources.js's own established shape.
// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- backs
// GET/PATCH /workers/{id}/personality and
// POST/DELETE /workers/{id}/personality/avatar-image
// (teracom-ai-backend 428b3b2). One profile per worker, optional --
// a worker with no profile behaves exactly as before this feature existed.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/workerPersonality.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchWorkerPersonality(token, workerId) {
  return backendFetch(`/workers/${workerId}/personality`, { token });
}

// One shared partial-update call -- only fields present in `payload` are
// changed, mirroring set_knowledge_metadata()/updateVendorSource()'s own
// real contract, reused a third time in this frontend.
export async function updateWorkerPersonality(token, workerId, payload) {
  return backendFetch(`/workers/${workerId}/personality`, { method: 'PATCH', token, body: payload });
}

export async function uploadWorkerAvatarImage(token, workerId, formData) {
  return backendFetch(`/workers/${workerId}/personality/avatar-image`, {
    method: 'POST',
    token,
    body: formData,
  });
}

export async function clearWorkerAvatarImage(token, workerId) {
  return backendFetch(`/workers/${workerId}/personality/avatar-image`, { method: 'DELETE', token });
}
