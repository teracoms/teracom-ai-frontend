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
// Also verified directly against source before building anything (not
// assumed from the architecture doc): there is no update or delete endpoint
// for a memory anywhere in teracom-ai-backend — only create (POST
// /memory/store) and read (GET /memory/{worker_id}, GET /memory-summary/).
// This UI accordingly has no edit/delete affordance for a memory — building
// one would imply a capability the backend cannot back.
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
