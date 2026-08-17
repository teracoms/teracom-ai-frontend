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
