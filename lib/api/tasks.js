// Server-only task data access, per Phase 0 Package N (Operations &
// Project Delivery Platform). Ungated, mirrors project creation's
// posture — any org member may create a task and change its status.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/tasks.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function createTask(token, payload) {
  return backendFetch('/tasks/', { method: 'POST', token, body: payload });
}

export async function updateTaskStatus(token, taskId, status) {
  return backendFetch(`/tasks/${taskId}/status`, { method: 'PATCH', token, body: { status } });
}

// Omitting projectId lists every task in the caller's own organisation;
// providing it scopes the list to one project.
export async function fetchTasks(token, projectId) {
  return backendFetch('/tasks/', {
    token,
    searchParams: projectId ? { project_id: projectId } : undefined,
  });
}

// AUTONOMOUS_EXECUTION_V1 — deliberately admin-tier backend-side
// (require_role("admin"), stricter than every other route on this
// router), not reachable from ordinary Task creation/status-change.
// Real, sandboxed, verified execution — not a preview.
export async function executeTask(token, taskId) {
  return backendFetch(`/tasks/${taskId}/execute`, { method: 'POST', token });
}

export async function fetchTaskExecutions(token, taskId) {
  return backendFetch(`/tasks/${taskId}/executions`, { token });
}
