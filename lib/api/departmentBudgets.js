// Server-only department budget data access, per Phase 0 Package M (CFO &
// Finance Platform). Mirrors Proposal/Quote/Contract's submit -> admin-
// decide shape (Package J) — the concrete deliverable behind governance's
// "human approval required for all financial commitments".
if (typeof window !== 'undefined') {
  throw new Error('lib/api/departmentBudgets.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function submitDepartmentBudget(token, payload) {
  return backendFetch('/department-budgets/', { method: 'POST', token, body: payload });
}

export async function decideDepartmentBudget(token, budgetId, decision, notes) {
  return backendFetch(`/department-budgets/${budgetId}/decide`, {
    method: 'POST',
    token,
    body: { decision, ...(notes ? { notes } : {}) },
  });
}

// Omitting departmentId lists every budget in the caller's own
// organisation (the org-wide Finance workspace); providing it scopes
// the list to one department (that department's own dashboard).
export async function fetchDepartmentBudgets(token, departmentId) {
  return backendFetch('/department-budgets/', {
    token,
    searchParams: departmentId ? { department_id: departmentId } : undefined,
  });
}
