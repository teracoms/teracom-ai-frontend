// Server-only administration data access, per FRONTEND_ARCHITECTURE_V1.md
// §C.11. Verified directly against teracom-ai-backend source before writing
// anything here (api/users.py, api/organisations.py, api/permissions.py) —
// see ADMIN_IMPLEMENTATION_REPORT.md §2 for the full findings, several of
// which diverge from what the architecture doc's prose alone would suggest.
//
// GET /organisations/ is deliberately NOT duplicated here — Package 2
// (Dashboard) already added fetchOrganisationSummary(token) to
// lib/api/dashboard.js for the exact same call, including its 403-degradation
// handling. This module only adds what no prior package already had: users
// and permissions.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/admin.js must only be used on the server.');
}

import { backendFetch } from './client.js';

/**
 * GET /users/ is admin-gated backend-side (require_role("admin")) — unlike
 * most other list endpoints in this app (workers, knowledge, memory), whose
 * reads are open to any authenticated org member. Verified directly against
 * api/users.py: both create AND list are admin-only here.
 */
export async function fetchUsers(token) {
  return backendFetch('/users/', { token });
}

/**
 * teracom-ai-backend's UserCreate schema requires `organisation_id` even
 * though api/users.py's create_user() ignores the submitted value and always
 * uses the caller's own token-derived organisation_id instead — the same
 * quirk already documented for WorkerCreate (see
 * WORKERS_IMPLEMENTATION_REPORT.md). The `password_hash` field name is also
 * misleading: the caller sends a plain-text password here, and
 * auth/security.py#hash_password() hashes it server-side — the frontend form
 * field is labelled "Password", not exposed with the backend's literal
 * field name.
 */
export async function createUser(token, payload) {
  return backendFetch('/users/', { method: 'POST', token, body: payload });
}

/**
 * PATCH /users/{id}/role — User Management. Backend-enforced (fail-closed,
 * 403) against both privilege escalation (a caller can never grant a role
 * above their own tier) and self-action (a caller can never change their
 * own role); this function does not duplicate either guard, it only proxies.
 */
export async function updateUserRole(token, userId, role) {
  return backendFetch(`/users/${userId}/role`, { method: 'PATCH', token, body: { role } });
}

/**
 * PATCH /users/{id}/status — deactivation takes effect immediately
 * (auth/dependencies.py#get_current_user() rejects the deactivated user's
 * existing tokens on their very next request), same self-action guard as
 * updateUserRole.
 */
export async function updateUserStatus(token, userId, status) {
  return backendFetch(`/users/${userId}/status`, { method: 'PATCH', token, body: { status } });
}

/**
 * GET /permissions/ is NOT admin-gated (only get_current_user) — any
 * authenticated org member can read the full knowledge↔worker permission
 * matrix, even though creating a grant through this same router (POST
 * /permissions/) is admin-only. This asymmetry is verified directly against
 * api/permissions.py, not assumed. Returns raw {id, knowledge_id, worker_id}
 * rows with no joined worker/knowledge names — the admin page cross-references
 * these against GET /worker-list/ and GET /knowledge/ (both already fetched by
 * prior packages) to render human-readable names.
 */
export async function fetchPermissions(token) {
  return backendFetch('/permissions/', { token });
}

/**
 * POST /permissions/ is admin-gated and, critically, has NO deduplication
 * check — unlike POST /worker-knowledge/assign (services/worker_knowledge_service.py
 * #assign_knowledge(), which returns the existing row if one already exists
 * for that worker+knowledge pair). Calling this twice for the same pair
 * creates two separate KnowledgePermission rows (verified live — see
 * ADMIN_IMPLEMENTATION_REPORT.md §2). The frontend guards against this by
 * excluding already-assigned pairs from the assign form's picker, but that is
 * a UI-side safeguard only; the backend itself does not prevent the
 * duplicate. There is also no DELETE route on this router at all — removing
 * a grant reuses the pre-existing DELETE /worker-knowledge/remove (same
 * underlying table), via lib/api/workers.js#removeWorkerKnowledge.
 */
export async function createPermission(token, workerId, knowledgeId) {
  return backendFetch('/permissions/', {
    method: 'POST',
    token,
    body: { worker_id: workerId, knowledge_id: knowledgeId },
  });
}
