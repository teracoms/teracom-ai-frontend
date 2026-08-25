// Server-only Department Memory data access, per Phase 0 Package H. Any
// member of the owning organisation may read (GET); only an admin may
// write (POST /department-memory/store) — see
// MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md §5. Both require the Memory
// Enrichment capability (Enterprise+) backend-side.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/departmentMemory.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchDepartmentMemories(token, departmentId) {
  return backendFetch(`/department-memory/${departmentId}`, { token });
}

export async function storeDepartmentMemory(token, departmentId, memory) {
  return backendFetch('/department-memory/store', {
    method: 'POST',
    token,
    body: { department_id: departmentId, memory },
  });
}

// CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
// §H4, same soft-delete pattern as lib/api/memory.js's archiveMemory().
export async function archiveDepartmentMemory(token, memoryId, departmentId) {
  return backendFetch(`/department-memory/${memoryId}/archive`, {
    method: 'PATCH',
    token,
    searchParams: { department_id: departmentId },
  });
}
