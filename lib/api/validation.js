// Pure request-shape validation, kept dependency-free and framework-free so it
// can be unit tested directly (see lib/api/__tests__/validation.test.js).
export function parseLoginCredentials(payload) {
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';

  if (!email || !password) {
    return { valid: false, email, password };
  }

  return { valid: true, email, password };
}

const WORKER_STATUSES = ['active', 'inactive'];

/**
 * teracom-ai-backend's WorkerCreate schema requires `organisation_id` in the
 * request body even though api/workers.py's create_worker() ignores the
 * submitted value and always uses the caller's own token-derived
 * organisation_id instead (see FRONTEND_ARCHITECTURE_V1.md-adjacent note in
 * WORKERS_IMPLEMENTATION_REPORT.md). The field is still required here so the
 * payload passes that schema's validation.
 */
export function parseWorkerPayload(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const role = typeof payload?.role === 'string' ? payload.role.trim() : '';
  const purpose = typeof payload?.purpose === 'string' ? payload.purpose.trim() : '';
  const instructions = typeof payload?.instructions === 'string' ? payload.instructions.trim() : '';
  const organisationId =
    typeof payload?.organisation_id === 'string' ? payload.organisation_id.trim() : '';
  const status = WORKER_STATUSES.includes(payload?.status) ? payload.status : 'active';

  if (!name || !role || !purpose || !instructions || !organisationId) {
    return { valid: false };
  }

  return {
    valid: true,
    name,
    role,
    purpose,
    instructions,
    status,
    organisation_id: organisationId,
  };
}

// teracom-ai-backend's SearchRequest schema (schemas/search.py) requires a
// non-empty `query` string — this mirrors that shape so a blank submission is
// rejected before it ever reaches the backend.
export function parseSearchQuery(payload) {
  const query = typeof payload?.query === 'string' ? payload.query.trim() : '';

  if (!query) {
    return { valid: false };
  }

  return { valid: true, query };
}

// teracom-ai-backend's ChatRequest schema (schemas/chat.py) requires
// non-empty `worker_id` and `message` strings.
export function parseChatMessage(payload) {
  const workerId = typeof payload?.worker_id === 'string' ? payload.worker_id.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!workerId || !message) {
    return { valid: false };
  }

  return { valid: true, worker_id: workerId, message };
}

// teracom-ai-backend's MemoryStoreRequest schema (schemas/memory.py) requires
// non-empty `worker_id` and `memory` strings.
export function parseMemoryPayload(payload) {
  const workerId = typeof payload?.worker_id === 'string' ? payload.worker_id.trim() : '';
  const memory = typeof payload?.memory === 'string' ? payload.memory.trim() : '';

  if (!workerId || !memory) {
    return { valid: false };
  }

  return { valid: true, worker_id: workerId, memory };
}

/**
 * teracom-ai-backend's UserCreate schema (schemas/user.py) requires
 * organisation_id, first_name, last_name, email, password_hash (a plain-text
 * password despite the name — see lib/api/admin.js) and role. `organisation_id`
 * is required by the schema even though api/users.py's create_user() ignores
 * the submitted value and always uses the caller's own token-derived
 * organisation_id instead — the same quirk parseWorkerPayload already
 * documents for WorkerCreate; still required here so the payload passes
 * that schema's validation, sourced from the signed-in user's own session
 * (see components/portal/CreateUserForm.js). `role` has no server-side enum
 * (a plain `str` column, exact-match checked by require_role) — this only
 * defaults an unrecognised value the same way parseWorkerPayload defaults an
 * unrecognised status, as a UI convenience, not a constraint the backend
 * itself enforces.
 */
const USER_ROLES = ['admin', 'member'];

export function parseUserPayload(payload) {
  const firstName = typeof payload?.first_name === 'string' ? payload.first_name.trim() : '';
  const lastName = typeof payload?.last_name === 'string' ? payload.last_name.trim() : '';
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const organisationId =
    typeof payload?.organisation_id === 'string' ? payload.organisation_id.trim() : '';
  const role = USER_ROLES.includes(payload?.role) ? payload.role : 'member';

  if (!firstName || !lastName || !email || !password || !organisationId) {
    return { valid: false };
  }

  return {
    valid: true,
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    role,
    organisation_id: organisationId,
  };
}

// teracom-ai-backend's PermissionCreate schema (schemas/permission.py)
// requires non-empty `worker_id` and `knowledge_id` strings.
export function parsePermissionPayload(payload) {
  const workerId = typeof payload?.worker_id === 'string' ? payload.worker_id.trim() : '';
  const knowledgeId = typeof payload?.knowledge_id === 'string' ? payload.knowledge_id.trim() : '';

  if (!workerId || !knowledgeId) {
    return { valid: false };
  }

  return { valid: true, worker_id: workerId, knowledge_id: knowledgeId };
}
