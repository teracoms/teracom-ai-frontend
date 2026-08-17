// Server-only Department Head communication data access, per Phase 0
// Package I (Department Head Layer & Executive Organisation). Direct,
// human-triggered communication between two Department Heads — reuses
// teracom-ai-backend's existing consult-then-synthesise mechanism
// (Phase 0 Package F), just access-restricted to current department
// heads and exposed as its own auditable endpoint (see
// PHASE_0_PACKAGE_I_DEPARTMENT_HEAD_IMPLEMENTATION_REPORT.md).
if (typeof window !== 'undefined') {
  throw new Error('lib/api/departmentHeads.js must only be used on the server.');
}

import { backendFetch } from './client.js';

// Calling this IS the human's explicit trigger — there is no suggestion
// step, since direct head-to-head communication names both participants
// up front rather than discovering one via a heuristic.
export async function consultDepartmentHeads(token, primaryHeadWorkerId, consultedHeadWorkerId, message) {
  return backendFetch('/department-heads/consult', {
    method: 'POST',
    token,
    body: {
      primary_worker_id: primaryHeadWorkerId,
      consulted_worker_id: consultedHeadWorkerId,
      message,
    },
  });
}

// Every completed consultation where both participants are (or were,
// at query time) a department's head — the narrower, governance-relevant
// slice of the generic GET /orchestration/consultations list.
export async function fetchDepartmentHeadConsultations(token) {
  return backendFetch('/department-heads/consultations', { token });
}
