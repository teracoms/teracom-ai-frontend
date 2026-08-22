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

// `purpose`/`function` — CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2. Both
// optional, both omitted from the body entirely when not provided,
// matching this function's own pre-existing `description` convention.
export async function createDepartment(token, name, description, purpose, functionTag) {
  return backendFetch('/departments/', {
    method: 'POST',
    token,
    body: {
      name,
      ...(description ? { description } : {}),
      ...(purpose ? { purpose } : {}),
      ...(functionTag ? { function: functionTag } : {}),
    },
  });
}

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 — "Edit Department". `updates`
// is a plain object with any of name/description/purpose — passed
// straight through, since PATCH /departments/{id} already treats each
// field as "update if present, leave unchanged if absent".
export async function updateDepartment(token, departmentId, updates) {
  return backendFetch(`/departments/${departmentId}`, {
    method: 'PATCH',
    token,
    body: updates,
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

// Phase 0 Package I (Department Head Layer & Executive Organisation).
// `workerId: null` clears a department's head. The worker (when non-null)
// must already belong to this department — teracom-ai-backend enforces
// this (400 otherwise), not this frontend.
export async function assignDepartmentHead(token, departmentId, workerId) {
  return backendFetch(`/departments/${departmentId}/head`, {
    method: 'PATCH',
    token,
    body: { worker_id: workerId },
  });
}

// The workers already scoped to a department — backs the Department Head
// dashboard.
export async function fetchDepartmentWorkers(token, departmentId) {
  return backendFetch(`/departments/${departmentId}/workers`, { token });
}

// Phase 0 Package J (Sales & Customer Success Platform). `function: null`
// clears a department's function tag ("sales" | "customer_success" | null) —
// lets the executive dashboard identify the right department reliably.
export async function assignDepartmentFunction(token, departmentId, functionTag) {
  return backendFetch(`/departments/${departmentId}/function`, {
    method: 'PATCH',
    token,
    body: { function: functionTag },
  });
}
