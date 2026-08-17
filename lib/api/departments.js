// Server-only Departments data access, per Phase 0 Package H (Knowledge &
// Memory Intelligence). Departments are an org-chart primitive, not gated
// by any Intelligence Cloud capability — unlike the memory tiers built on
// top of them (lib/api/organisationMemory.js, lib/api/departmentMemory.js).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/departments.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchDepartments(token) {
  return backendFetch('/departments/', { token });
}

export async function fetchDepartment(token, departmentId) {
  return backendFetch(`/departments/${departmentId}`, { token });
}

export async function createDepartment(token, name, description) {
  return backendFetch('/departments/', {
    method: 'POST',
    token,
    body: { name, ...(description ? { description } : {}) },
  });
}

// `departmentId: null` clears a worker's department assignment —
// teracom-ai-backend's PATCH /workers/{id}/department accepts an explicit
// null for exactly this (schemas/department.py#WorkerDepartmentAssignment).
export async function assignWorkerDepartment(token, workerId, departmentId) {
  return backendFetch(`/workers/${workerId}/department`, {
    method: 'PATCH',
    token,
    body: { department_id: departmentId },
  });
}
