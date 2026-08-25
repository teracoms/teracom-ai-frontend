// Server-only Organisation Memory data access, per Phase 0 Package H.
// GET/POST /organisation-memory/* are admin-only AND require the Memory
// Enrichment capability (Enterprise+) backend-side — see
// MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md §5 for the full governance
// ladder this package establishes across worker/department/organisation
// memory tiers.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/organisationMemory.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchOrganisationMemories(token) {
  return backendFetch('/organisation-memory/', { token });
}

export async function storeOrganisationMemory(token, memory) {
  return backendFetch('/organisation-memory/store', {
    method: 'POST',
    token,
    body: { memory },
  });
}

// CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
// §H4, same soft-delete pattern as lib/api/memory.js's archiveMemory().
export async function archiveOrganisationMemory(token, memoryId) {
  return backendFetch(`/organisation-memory/${memoryId}/archive`, {
    method: 'PATCH',
    token,
  });
}
