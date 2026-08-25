// Server-only memory data access, per FRONTEND_ARCHITECTURE_V1.md §C.10.
//
// GET /memory/{worker_id} (the per-worker read) is deliberately NOT
// duplicated here — Package 3 (Workers) already added
// fetchWorkerMemories(token, workerId) to lib/api/workers.js for the worker
// detail page's Memory section, and it's the exact same call this package
// needs, fetched repeatedly per worker (see MEMORY_IMPLEMENTATION_REPORT.md
// §2 for why a per-worker fan-out, not a single org-wide call, is the only
// option — there is no "all memories for my organisation" endpoint).
//
// CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
// §H4. Was: "there is no update or delete endpoint for a memory anywhere in
// teracom-ai-backend — only create (POST /memory/store) and read." A real
// archive (soft-delete) endpoint now exists -- PATCH /memory/{id}/archive,
// admin-only, matching the write gate on POST /memory/store -- and
// GET /memory/{worker_id} excludes archived rows by default. Still no true
// update or physical delete (a deliberate, additive-only design choice, not
// a remaining gap -- see models/worker_memory.py's own comment backend-side).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/memory.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchMemorySummary(token) {
  return backendFetch('/memory-summary/', { token });
}

/**
 * services/memory_service.py#store_memory() always sets memory_type="fact"
 * server-side regardless of what's sent — schemas/memory.py#MemoryStoreRequest
 * only accepts {worker_id, memory} (a full MemoryCreate schema with a
 * memory_type field exists but is never used by any route — confirmed by
 * grepping the backend source, dead code there, not something this frontend
 * needs to account for).
 */
export async function storeMemory(token, workerId, memory) {
  return backendFetch('/memory/store', {
    method: 'POST',
    token,
    body: { worker_id: workerId, memory },
  });
}

export async function archiveMemory(token, memoryId, workerId) {
  return backendFetch(`/memory/${memoryId}/archive`, {
    method: 'PATCH',
    token,
    searchParams: { worker_id: workerId },
  });
}
