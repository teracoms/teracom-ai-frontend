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

// Password reset workflow foundation ("Platform Review Wave 1").
export function parseForgotPasswordPayload(payload) {
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';

  if (!email) {
    return { valid: false };
  }

  return { valid: true, email };
}

export function parseResetPasswordPayload(payload) {
  const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
  const newPassword = typeof payload?.newPassword === 'string' ? payload.newPassword : '';

  if (!token || newPassword.length < 8) {
    return { valid: false };
  }

  return { valid: true, token, newPassword };
}

// Trial experience foundation ("Platform Review Wave 1") — same shape
// backend's SignupRequest already validates; this is a client-visible
// pre-check only, not a substitute for it.
export function parseTrialSignupPayload(payload) {
  const organisationName = typeof payload?.organisationName === 'string' ? payload.organisationName.trim() : '';
  const adminFirstName = typeof payload?.adminFirstName === 'string' ? payload.adminFirstName.trim() : '';
  const adminLastName = typeof payload?.adminLastName === 'string' ? payload.adminLastName.trim() : '';
  const adminEmail = typeof payload?.adminEmail === 'string' ? payload.adminEmail.trim() : '';
  const adminPassword = typeof payload?.adminPassword === 'string' ? payload.adminPassword : '';

  if (!organisationName || !adminFirstName || !adminLastName || !adminEmail || adminPassword.length < 8) {
    return { valid: false };
  }

  return { valid: true, organisationName, adminFirstName, adminLastName, adminEmail, adminPassword };
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

// teracom-ai-backend's ConsultationSuggestRequest schema (Phase 0 Package F,
// schemas/orchestration.py) requires primary_worker_id and message.
export function parseConsultationSuggestPayload(payload) {
  const primaryWorkerId =
    typeof payload?.primary_worker_id === 'string' ? payload.primary_worker_id.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!primaryWorkerId || !message) {
    return { valid: false };
  }

  return { valid: true, primary_worker_id: primaryWorkerId, message };
}

// ConsultationExecuteRequest additionally requires consulted_worker_id.
export function parseConsultationExecutePayload(payload) {
  const primaryWorkerId =
    typeof payload?.primary_worker_id === 'string' ? payload.primary_worker_id.trim() : '';
  const consultedWorkerId =
    typeof payload?.consulted_worker_id === 'string' ? payload.consulted_worker_id.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!primaryWorkerId || !consultedWorkerId || !message) {
    return { valid: false };
  }

  return {
    valid: true,
    primary_worker_id: primaryWorkerId,
    consulted_worker_id: consultedWorkerId,
    message,
  };
}

// teracom-ai-backend's CtoPlanRequest schema (Phase 0 Package G,
// schemas/cto_orchestration.py) requires primary_worker_id and
// objective; max_hops is optional and passed through only when a
// valid positive integer was actually submitted.
export function parseCtoPlanPayload(payload) {
  const primaryWorkerId =
    typeof payload?.primary_worker_id === 'string' ? payload.primary_worker_id.trim() : '';
  const objective = typeof payload?.objective === 'string' ? payload.objective.trim() : '';
  const maxHops = Number.isInteger(payload?.max_hops) && payload.max_hops > 0 ? payload.max_hops : undefined;

  if (!primaryWorkerId || !objective) {
    return { valid: false };
  }

  return { valid: true, primary_worker_id: primaryWorkerId, objective, max_hops: maxHops };
}

// CtoExecuteRequest additionally accepts an optional `steps` array
// (each a {worker_id, subtask} pair) — present when re-submitting a
// previously-reviewed plan, omitted when the caller wants the chain
// decomposed and executed in one call.
export function parseCtoExecutePayload(payload) {
  const primaryWorkerId =
    typeof payload?.primary_worker_id === 'string' ? payload.primary_worker_id.trim() : '';
  const objective = typeof payload?.objective === 'string' ? payload.objective.trim() : '';

  if (!primaryWorkerId || !objective) {
    return { valid: false };
  }

  let steps;
  if (Array.isArray(payload?.steps) && payload.steps.length > 0) {
    steps = payload.steps.map((step) => ({
      worker_id: typeof step?.worker_id === 'string' ? step.worker_id.trim() : '',
      subtask: typeof step?.subtask === 'string' ? step.subtask.trim() : '',
    }));

    if (steps.some((step) => !step.worker_id || !step.subtask)) {
      return { valid: false };
    }
  }

  return { valid: true, primary_worker_id: primaryWorkerId, objective, steps };
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
 * (see components/portal/CreateUserForm.js). `role` mirrors the Human
 * Authority Model's real 5-tier hierarchy (backend/auth/roles.py#ROLE_ORDER,
 * backend/schemas/user.py#UserRole — a genuine Pydantic Literal plus a DB
 * CHECK constraint, not a free string any more). "employee" is this
 * hierarchy's real-world equivalent of the old informal "member" default.
 */
const USER_ROLES = ['owner', 'admin', 'manager', 'employee', 'read_only'];

export function parseUserPayload(payload) {
  const firstName = typeof payload?.first_name === 'string' ? payload.first_name.trim() : '';
  const lastName = typeof payload?.last_name === 'string' ? payload.last_name.trim() : '';
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const organisationId =
    typeof payload?.organisation_id === 'string' ? payload.organisation_id.trim() : '';
  const role = USER_ROLES.includes(payload?.role) ? payload.role : 'employee';

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

// User Management (backend PATCH /users/{id}/role, /users/{id}/status) —
// both are real, enforced enums server-side (schemas/user.py#UserRoleUpdate/
// UserStatusUpdate), so an invalid value here is rejected before ever
// reaching the backend rather than surfacing as a 422 from it.
export function parseUserRoleUpdatePayload(payload) {
  const role = USER_ROLES.includes(payload?.role) ? payload.role : '';
  if (!role) return { valid: false };

  return { valid: true, role };
}

const USER_STATUSES = ['active', 'inactive'];

export function parseUserStatusUpdatePayload(payload) {
  const status = USER_STATUSES.includes(payload?.status) ? payload.status : '';
  if (!status) return { valid: false };

  return { valid: true, status };
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

// Phase 0 Package H (Knowledge & Memory Intelligence) — teracom-ai-backend's
// DepartmentCreate schema requires a non-blank `name`; `description` is
// optional.
// TECHNICAL_SUPPORT_OS_MVP_V1 -- "Add Vendor Source" form. https-only,
// matching the backend's own SSRF-guard scheme check (services/
// vendor_crawler_service.py) -- rejecting an obviously-wrong URL here
// is a UX nicety, not the real security boundary, which is enforced
// server-side regardless.
const VENDOR_SOURCE_SCHEDULE_INTERVALS = new Set(['daily', 'weekly', 'manual']);

export function parseVendorSourcePayload(payload) {
  const vendorName = typeof payload?.vendor_name === 'string' ? payload.vendor_name.trim() : '';
  const resourceUrl = typeof payload?.resource_url === 'string' ? payload.resource_url.trim() : '';
  const workerId = typeof payload?.worker_id === 'string' ? payload.worker_id.trim() : '';
  const scheduleIntervalRaw =
    typeof payload?.schedule_interval === 'string' ? payload.schedule_interval.trim() : '';
  const scheduleInterval = VENDOR_SOURCE_SCHEDULE_INTERVALS.has(scheduleIntervalRaw)
    ? scheduleIntervalRaw
    : 'manual';

  if (!vendorName || !resourceUrl || !workerId || !resourceUrl.startsWith('https://')) {
    return { valid: false };
  }

  return {
    valid: true,
    vendor_name: vendorName,
    resource_url: resourceUrl,
    worker_id: workerId,
    schedule_interval: scheduleInterval,
  };
}

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- backs the shared PATCH
// endpoint (edit / enable-disable / schedule-change / remove). Every
// field is optional; only fields genuinely present in `payload` are
// forwarded, mirroring the backend's own "only update what's explicitly
// passed" contract rather than sending a full object with defaults that
// would silently overwrite fields the caller never meant to touch.
export function parseVendorSourceUpdatePayload(payload) {
  const result = {};

  if (typeof payload?.vendor_name === 'string' && payload.vendor_name.trim()) {
    result.vendor_name = payload.vendor_name.trim();
  }

  if (typeof payload?.resource_url === 'string' && payload.resource_url.trim()) {
    const url = payload.resource_url.trim();
    if (!url.startsWith('https://')) {
      return { valid: false };
    }
    result.resource_url = url;
  }

  if (typeof payload?.worker_id === 'string' && payload.worker_id.trim()) {
    result.worker_id = payload.worker_id.trim();
  }

  if (typeof payload?.enabled === 'boolean') {
    result.enabled = payload.enabled;
  }

  if (typeof payload?.schedule_interval === 'string') {
    if (!VENDOR_SOURCE_SCHEDULE_INTERVALS.has(payload.schedule_interval)) {
      return { valid: false };
    }
    result.schedule_interval = payload.schedule_interval;
  }

  if (payload?.removed === true) {
    result.removed = true;
  }

  if (Object.keys(result).length === 0) {
    return { valid: false };
  }

  return { valid: true, ...result };
}

export function parseDepartmentPayload(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const description =
    typeof payload?.description === 'string' && payload.description.trim()
      ? payload.description.trim()
      : undefined;
  // CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 — purpose/function, both
  // optional, same convention as description above.
  const purpose =
    typeof payload?.purpose === 'string' && payload.purpose.trim() ? payload.purpose.trim() : undefined;
  const functionTag =
    typeof payload?.function === 'string' && payload.function.trim() ? payload.function.trim() : undefined;

  if (!name) {
    return { valid: false };
  }

  return { valid: true, name, description, purpose, function: functionTag };
}

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 — "Edit Department". Every
// field optional; at least one must be present and non-blank for the
// update to mean anything, matching DepartmentUpdate's own backend
// shape (schemas/department.py).
export function parseDepartmentUpdatePayload(payload) {
  const result = {};

  if (typeof payload?.name === 'string' && payload.name.trim()) {
    result.name = payload.name.trim();
  }
  if (typeof payload?.description === 'string') {
    result.description = payload.description.trim();
  }
  if (typeof payload?.purpose === 'string') {
    result.purpose = payload.purpose.trim();
  }

  if (Object.keys(result).length === 0) {
    return { valid: false };
  }

  return { valid: true, ...result };
}

// OrganisationCreate requires a non-blank name and slug.
export function parseOrganisationPayload(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const slug = typeof payload?.slug === 'string' ? payload.slug.trim() : '';

  if (!name || !slug) {
    return { valid: false };
  }

  return { valid: true, name, slug };
}

// OrganisationMemoryStoreRequest requires a non-blank `memory`.
export function parseOrganisationMemoryPayload(payload) {
  const memory = typeof payload?.memory === 'string' ? payload.memory.trim() : '';

  if (!memory) {
    return { valid: false };
  }

  return { valid: true, memory };
}

// DepartmentMemoryStoreRequest requires non-blank `department_id` and `memory`.
export function parseDepartmentMemoryPayload(payload) {
  const departmentId =
    typeof payload?.department_id === 'string' ? payload.department_id.trim() : '';
  const memory = typeof payload?.memory === 'string' ? payload.memory.trim() : '';

  if (!departmentId || !memory) {
    return { valid: false };
  }

  return { valid: true, department_id: departmentId, memory };
}

const MEMORY_SUMMARY_SCOPES = ['organisation', 'department', 'worker'];

// MemorySummaryGenerateRequest requires `scope` (one of the three tiers) and
// a non-blank `scope_id`.
export function parseMemorySummaryRequestPayload(payload) {
  const scope = MEMORY_SUMMARY_SCOPES.includes(payload?.scope) ? payload.scope : '';
  const scopeId = typeof payload?.scope_id === 'string' ? payload.scope_id.trim() : '';

  if (!scope || !scopeId) {
    return { valid: false };
  }

  return { valid: true, scope, scope_id: scopeId };
}

// Phase 0 Package I (Department Head Layer & Executive Organisation) —
// DepartmentHeadAssignment accepts `worker_id` as a string or an explicit
// null (clears the headship); anything else (missing key, non-string,
// non-null) is invalid.
export function parseDepartmentHeadAssignmentPayload(payload) {
  if (payload?.worker_id === null) {
    return { valid: true, worker_id: null };
  }

  const workerId = typeof payload?.worker_id === 'string' ? payload.worker_id.trim() : '';

  if (!workerId) {
    return { valid: false };
  }

  return { valid: true, worker_id: workerId };
}

// ConsultationExecuteRequest, reused for department-head-to-department-head
// consultation — requires non-blank primary_worker_id/consulted_worker_id
// and message.
export function parseDepartmentHeadConsultPayload(payload) {
  const primaryWorkerId =
    typeof payload?.primary_worker_id === 'string' ? payload.primary_worker_id.trim() : '';
  const consultedWorkerId =
    typeof payload?.consulted_worker_id === 'string' ? payload.consulted_worker_id.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!primaryWorkerId || !consultedWorkerId || !message) {
    return { valid: false };
  }

  return { valid: true, primary_worker_id: primaryWorkerId, consulted_worker_id: consultedWorkerId, message };
}

// Phase 0 Package J (Sales & Customer Success Platform) — CrmContactCreate
// requires a non-blank `name`; everything else is optional.
export function parseContactIntakePayload(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';

  if (!name) {
    return { valid: false };
  }

  const optionalTrimmed = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

  return {
    valid: true,
    name,
    company: optionalTrimmed(payload?.company),
    email: optionalTrimmed(payload?.email),
    phone: optionalTrimmed(payload?.phone),
    source: optionalTrimmed(payload?.source),
  };
}

const CRM_CONTACT_STAGES = ['prospect', 'lead', 'customer'];

export function parseContactStagePayload(payload) {
  const stage = CRM_CONTACT_STAGES.includes(payload?.stage) ? payload.stage : '';

  if (!stage) {
    return { valid: false };
  }

  return { valid: true, stage };
}

const CRM_CONTACT_HEALTH_STATUSES = ['healthy', 'at_risk', 'churned'];

export function parseContactHealthPayload(payload) {
  const healthStatus = CRM_CONTACT_HEALTH_STATUSES.includes(payload?.health_status) ? payload.health_status : '';

  if (!healthStatus) {
    return { valid: false };
  }

  return { valid: true, health_status: healthStatus };
}

function _requireNonBlank(payload, fields) {
  const result = {};
  for (const field of fields) {
    const value = typeof payload?.[field] === 'string' ? payload[field].trim() : '';
    if (!value) return null;
    result[field] = value;
  }
  return result;
}

// ProposalCreate/QuoteCreate/ContractCreate all share this shape —
// crm_contact_id/title/content required, amount optional.
export function parseDealDocumentPayload(payload) {
  const required = _requireNonBlank(payload, ['crm_contact_id', 'title', 'content']);
  if (!required) return { valid: false };

  const amount = typeof payload?.amount === 'number' ? payload.amount : undefined;

  return { valid: true, ...required, amount };
}

// ProposalDraftRequest — crm_contact_id/title/brief required, plus the
// worker_id query param the backend route needs.
export function parseProposalDraftPayload(payload) {
  const required = _requireNonBlank(payload, ['crm_contact_id', 'title', 'brief', 'worker_id']);
  if (!required) return { valid: false };

  return { valid: true, ...required };
}

// Shared by every /decide BFF route (proposals/quotes/contracts).
export function parseDealDecisionPayload(payload) {
  if (payload?.decision !== 'approved' && payload?.decision !== 'rejected') {
    return { valid: false };
  }

  const notes = typeof payload?.notes === 'string' && payload.notes.trim() ? payload.notes.trim() : undefined;

  return { valid: true, decision: payload.decision, notes };
}

export function parseOnboardingSeedPayload(payload) {
  const crmContactId = typeof payload?.crm_contact_id === 'string' ? payload.crm_contact_id.trim() : '';

  if (!crmContactId) {
    return { valid: false };
  }

  return { valid: true, crm_contact_id: crmContactId };
}

// DepartmentFunctionAssignment — "sales" | "customer_success" |
// "marketing" | "finance" | "operations" | explicit null.
const DEPARTMENT_FUNCTIONS = ['sales', 'customer_success', 'marketing', 'finance', 'operations'];

export function parseDepartmentFunctionPayload(payload) {
  if (payload?.function === null) {
    return { valid: true, function: null };
  }

  if (!DEPARTMENT_FUNCTIONS.includes(payload?.function)) {
    return { valid: false };
  }

  return { valid: true, function: payload.function };
}

// Phase 0 Package K (Marketing & Media Platform) — CampaignCreate
// requires a non-blank `name`; everything else is optional.
export function parseCampaignPayload(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';

  if (!name) {
    return { valid: false };
  }

  const objective = typeof payload?.objective === 'string' && payload.objective.trim() ? payload.objective.trim() : undefined;
  const ownerWorkerId =
    typeof payload?.owner_worker_id === 'string' && payload.owner_worker_id.trim()
      ? payload.owner_worker_id.trim()
      : undefined;

  return { valid: true, name, objective, owner_worker_id: ownerWorkerId };
}

const CAMPAIGN_STAGES = ['planning', 'active', 'completed'];

export function parseCampaignStagePayload(payload) {
  const stage = CAMPAIGN_STAGES.includes(payload?.stage) ? payload.stage : '';

  if (!stage) {
    return { valid: false };
  }

  return { valid: true, stage };
}

// ContentPieceCreate/VideoAssetCreate share this shape — campaign_id/title
// required, plus one body field required whose name differs by kind
// ("content" for content pieces, "script" for video assets) — pass
// bodyField accordingly. `content_piece_id` is video-only (the chain from
// the content piece a video is derived from) but harmless to pass through
// unconditionally.
export function parseMarketingProductionPayload(payload, bodyField) {
  const required = _requireNonBlank(payload, ['campaign_id', 'title', bodyField]);
  if (!required) return { valid: false };

  const contentPieceId =
    typeof payload?.content_piece_id === 'string' && payload.content_piece_id.trim()
      ? payload.content_piece_id.trim()
      : undefined;

  return { valid: true, ...required, content_piece_id: contentPieceId };
}

// ContentPieceDraftRequest requires `brief`; VideoAssetDraftRequest does
// not (it drafts from an optional linked content piece instead) — pass
// requireBrief: true only for the content-draft BFF route.
export function parseMarketingDraftPayload(payload, { requireBrief } = {}) {
  const fields = requireBrief ? ['campaign_id', 'title', 'brief', 'worker_id'] : ['campaign_id', 'title', 'worker_id'];
  const required = _requireNonBlank(payload, fields);
  if (!required) return { valid: false };

  const contentPieceId =
    typeof payload?.content_piece_id === 'string' && payload.content_piece_id.trim()
      ? payload.content_piece_id.trim()
      : undefined;

  return { valid: true, ...required, content_piece_id: contentPieceId };
}

// MediaCentreItemPublishRequest — kind/title required; exactly one of
// content_piece_id/video_asset_id is expected (enforced backend-side, not
// here — same "don't duplicate the backend's own validation" convention
// this file already follows elsewhere).
const MEDIA_CENTRE_KINDS = ['content', 'video'];

export function parseMediaPublishPayload(payload) {
  const kind = MEDIA_CENTRE_KINDS.includes(payload?.kind) ? payload.kind : '';
  if (!kind) return { valid: false };

  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!title) return { valid: false };

  const contentPieceId =
    typeof payload?.content_piece_id === 'string' && payload.content_piece_id.trim()
      ? payload.content_piece_id.trim()
      : undefined;
  const videoAssetId =
    typeof payload?.video_asset_id === 'string' && payload.video_asset_id.trim()
      ? payload.video_asset_id.trim()
      : undefined;

  return { valid: true, kind, title, content_piece_id: contentPieceId, video_asset_id: videoAssetId };
}

// Phase 0 Package L (Federation Registry & External AI Consulting) —
// FederationConsultationSuggestRequest requires worker_id/message.
export function parseFederationSuggestPayload(payload) {
  const required = _requireNonBlank(payload, ['worker_id', 'message']);
  if (!required) return { valid: false };

  return { valid: true, ...required };
}

// FederationConsultationExecuteRequest — worker_id/message required,
// federation_provider_id optional (a human may deliberately pick a
// provider even without a low-confidence trigger).
export function parseFederationConsultPayload(payload) {
  const required = _requireNonBlank(payload, ['worker_id', 'message']);
  if (!required) return { valid: false };

  const federationProviderId =
    typeof payload?.federation_provider_id === 'string' && payload.federation_provider_id.trim()
      ? payload.federation_provider_id.trim()
      : undefined;

  return { valid: true, ...required, federation_provider_id: federationProviderId };
}

// FederationEnabledUpdate — the governance-control toggle (objective #6).
export function parseFederationEnabledPayload(payload) {
  if (typeof payload?.federation_enabled !== 'boolean') {
    return { valid: false };
  }

  return { valid: true, federation_enabled: payload.federation_enabled };
}

// CUSTOMER_UX_ACCEPTANCE_V1 -- must match schemas.organisation.
// FederationModeUpdate's Literal exactly.
export const FEDERATION_MODES = ['internal_only', 'internal_and_internet', 'external_providers'];

export function parseFederationModePayload(payload) {
  if (!FEDERATION_MODES.includes(payload?.federation_mode)) {
    return { valid: false };
  }

  return { valid: true, federation_mode: payload.federation_mode };
}

// Phase 0 Package M (CFO & Finance Platform) — DepartmentBudgetCreate
// requires department_id/period_label (non-blank) and a numeric
// amount_allocated. DepartmentBudgetDecision reuses
// parseDealDecisionPayload directly (identical {decision, notes} shape).
export function parseDepartmentBudgetPayload(payload) {
  const required = _requireNonBlank(payload, ['department_id', 'period_label']);
  if (!required) return { valid: false };

  const amountAllocated = typeof payload?.amount_allocated === 'number' ? payload.amount_allocated : undefined;
  if (amountAllocated === undefined) return { valid: false };

  return { valid: true, ...required, amount_allocated: amountAllocated };
}

// ProposalCostEstimateUpdate — an internal cost-to-deliver figure,
// distinct from the customer-facing `amount`.
export function parseProposalCostEstimatePayload(payload) {
  if (typeof payload?.internal_cost_estimate !== 'number') {
    return { valid: false };
  }

  return { valid: true, internal_cost_estimate: payload.internal_cost_estimate };
}

// Phase 0 Package N (Operations & Project Delivery Platform) —
// ProjectCreate requires a non-blank `name`; description/department_id
// optional. Created directly, no submit/decide step (ungated — see
// PROJECT_STATUS values below).
export function parseProjectPayload(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  if (!name) return { valid: false };

  const description =
    typeof payload?.description === 'string' && payload.description.trim() ? payload.description.trim() : undefined;
  const departmentId =
    typeof payload?.department_id === 'string' && payload.department_id.trim()
      ? payload.department_id.trim()
      : undefined;

  return { valid: true, name, description, department_id: departmentId };
}

// "blocked" -- AUTONOMOUS_PROJECTS_V1's real, bidirectional project
// lifecycle (active <-> blocked <-> completed); ProjectPanel.js's own
// status <select> already offers it, but this array (and therefore
// every request through it) silently rejected it until now -- a real,
// live bug found during DIGITAL_ORGANISATION_UX_V1's own GUI review,
// not a hypothetical.
const PROJECT_STATUSES = ['active', 'completed', 'blocked', 'archived'];

export function parseProjectStatusPayload(payload) {
  const status = PROJECT_STATUSES.includes(payload?.status) ? payload.status : '';
  if (!status) return { valid: false };

  return { valid: true, status };
}

// TaskCreate — project_id/title required; description/assignee_worker_id/
// assignee_worker_pool_id/due_date/priority optional.
export function parseTaskPayload(payload) {
  const required = _requireNonBlank(payload, ['project_id', 'title']);
  if (!required) return { valid: false };

  const description =
    typeof payload?.description === 'string' && payload.description.trim() ? payload.description.trim() : undefined;
  const assigneeWorkerId =
    typeof payload?.assignee_worker_id === 'string' && payload.assignee_worker_id.trim()
      ? payload.assignee_worker_id.trim()
      : undefined;
  // MULTI_ORGANISATION_PLATFORM_V1 -- a task may name a Worker Pool
  // instead of one fixed worker; the backend resolves "an available
  // worker within the pool" at execution time, not here.
  const assigneeWorkerPoolId =
    typeof payload?.assignee_worker_pool_id === 'string' && payload.assignee_worker_pool_id.trim()
      ? payload.assignee_worker_pool_id.trim()
      : undefined;
  const dueDate = typeof payload?.due_date === 'string' && payload.due_date.trim() ? payload.due_date.trim() : undefined;
  const priority = typeof payload?.priority === 'string' && payload.priority.trim() ? payload.priority.trim() : undefined;

  return {
    valid: true,
    ...required,
    description,
    assignee_worker_id: assigneeWorkerId,
    assignee_worker_pool_id: assigneeWorkerPoolId,
    due_date: dueDate,
    priority,
  };
}

// AUTONOMOUS_ORGANISATION_V1 — "failed" added: real, system-set on a
// verification failure (services/execution_service.py), but also a
// real target a human may set directly (e.g. abandoning a task),
// same as every other status here.
const TASK_STATUSES = ['pending', 'in_progress', 'done', 'failed'];

export function parseTaskStatusPayload(payload) {
  const status = TASK_STATUSES.includes(payload?.status) ? payload.status : '';
  if (!status) return { valid: false };

  return { valid: true, status };
}

// AUTONOMOUS_ORGANISATION_V1 — ProjectPlanRequest: primary_worker_id/
// objective/name required; department_id optional.
export function parseProjectPlanPayload(payload) {
  const required = _requireNonBlank(payload, ['primary_worker_id', 'objective', 'name']);
  if (!required) return { valid: false };

  const departmentId =
    typeof payload?.department_id === 'string' && payload.department_id.trim()
      ? payload.department_id.trim()
      : undefined;

  return { valid: true, ...required, department_id: departmentId };
}

// PROJECT_EXECUTION_AND_VOICE_V1 -- the existing-project sibling of
// parseProjectPlanPayload() above; only a real, already-owned worker
// id is required, since the objective/name are read from the
// project's own real Requirements/name server-side, not resupplied.
export function parseProjectEngineeringPlanPayload(payload) {
  const required = _requireNonBlank(payload, ['primary_worker_id']);
  if (!required) return { valid: false };
  return { valid: true, ...required };
}

// Phase 0 Package O (Customer Portal & Self-Service Platform) —
// SupportRequestCreate requires a valid request_type plus non-blank
// subject/description.
const SUPPORT_REQUEST_TYPES = ['support', 'incident'];

export function parseSupportRequestPayload(payload) {
  const requestType = SUPPORT_REQUEST_TYPES.includes(payload?.request_type) ? payload.request_type : '';
  if (!requestType) return { valid: false };

  const required = _requireNonBlank(payload, ['subject', 'description']);
  if (!required) return { valid: false };

  return { valid: true, request_type: requestType, ...required };
}

const SUPPORT_REQUEST_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export function parseSupportRequestStatusPayload(payload) {
  const status = SUPPORT_REQUEST_STATUSES.includes(payload?.status) ? payload.status : '';
  if (!status) return { valid: false };

  return { valid: true, status };
}

export function parseSupportRequestMessagePayload(payload) {
  const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
  if (!body) return { valid: false };

  return { valid: true, body };
}

// PortalContactAccountCreate — admin-only, creates a Customer Portal login.
export function parsePortalContactAccountPayload(payload) {
  const required = _requireNonBlank(payload, ['email', 'password']);
  if (!required) return { valid: false };

  return { valid: true, ...required };
}

// Phase 0 Package PQR (Worker Lifecycle & Governance) —
// WorkerCreationRequestCreate mirrors WorkerCreate's own fields.
export function parseWorkerCreationRequestPayload(payload) {
  const required = _requireNonBlank(payload, ['name', 'role', 'purpose', 'instructions']);
  if (!required) return { valid: false };

  return { valid: true, ...required };
}

// Shared by WorkerCreationRequestDecision and DeploymentRecordDecision
// — identical {decision, notes} shape to parseDealDecisionPayload,
// reused directly rather than duplicated.

const WORKER_STATUS_VALUES = ['active', 'inactive'];

export function parseWorkerStatusPayload(payload) {
  const status = WORKER_STATUS_VALUES.includes(payload?.status) ? payload.status : '';
  if (!status) return { valid: false };

  return { valid: true, status };
}

// Phase 0 Package PQR (Production Operations Platform) —
// DeploymentRecordCreate requires a non-blank version_label;
// description is optional.
export function parseDeploymentRecordPayload(payload) {
  const versionLabel = typeof payload?.version_label === 'string' ? payload.version_label.trim() : '';
  if (!versionLabel) return { valid: false };

  const description =
    typeof payload?.description === 'string' && payload.description.trim() ? payload.description.trim() : undefined;

  return { valid: true, version_label: versionLabel, description };
}

// PlatformIncidentCreate — title/description/severity all required.
const PLATFORM_INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'];

export function parsePlatformIncidentPayload(payload) {
  const severity = PLATFORM_INCIDENT_SEVERITIES.includes(payload?.severity) ? payload.severity : '';
  if (!severity) return { valid: false };

  const required = _requireNonBlank(payload, ['title', 'description']);
  if (!required) return { valid: false };

  return { valid: true, ...required, severity };
}

const PLATFORM_INCIDENT_STATUSES = ['open', 'monitoring', 'resolved'];

export function parsePlatformIncidentStatusPayload(payload) {
  const status = PLATFORM_INCIDENT_STATUSES.includes(payload?.status) ? payload.status : '';
  if (!status) return { valid: false };

  return { valid: true, status };
}

// GovernanceRuleSet (backend services/governance_cascade_service.py) —
// rule_type is one of exactly 5 known values (validated backend-side too,
// this is only the same fail-fast-at-the-boundary courtesy every other
// enum field here gets); rule_key is a free-text string, matching the
// backend's own lack of a fixed key registry (RULE_TYPES is deliberately
// narrow, rule keys are not — see that service's own docstring). Every
// JSON type (string/number/boolean/array) is valid for `rule_value`,
// including `false`/`0`/`""` — this only rejects `undefined` (the field
// missing entirely), not falsy-but-present values.
// "security" added by Settings & Security V1 -- powers Organisation
// Security (Enforce MFA / Session Policies / Security Policies) via this
// exact same engine, SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.6.
export const GOVERNANCE_RULE_TYPES = ['governance', 'policy', 'standards', 'knowledge_assignment', 'security'];

// KnowledgeMetadataUpdate (backend services/metadata_service.py) — every
// field is independently optional, and the backend's own update function
// only ever checks `is not None` per field (set_knowledge_metadata), so
// document_type/sensitivity_level can be set to one of their closed values
// but never explicitly cleared back to null once set — only omitting the
// field (leaving it unchanged) is possible for those two; `tags` is the
// only field with a real "clear" path, via an explicit empty array.
// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 5 added five values (procedure,
// sop, training_material, organisational_knowledge, reference_document)
// -- mirrors backend/services/metadata_service.py#DOCUMENT_TYPES exactly.
export const KNOWLEDGE_DOCUMENT_TYPES = [
  'policy',
  'pricing_reference',
  'case_study',
  'template',
  'general',
  'procedure',
  'sop',
  'training_material',
  'organisational_knowledge',
  'reference_document',
];
export const KNOWLEDGE_SENSITIVITY_LEVELS = ['public', 'internal', 'confidential'];

export function parseKnowledgeMetadataPayload(payload) {
  const result = {};

  if (typeof payload?.document_type === 'string' && payload.document_type !== '') {
    if (!KNOWLEDGE_DOCUMENT_TYPES.includes(payload.document_type)) return { valid: false };
    result.document_type = payload.document_type;
  }

  if (typeof payload?.sensitivity_level === 'string' && payload.sensitivity_level !== '') {
    if (!KNOWLEDGE_SENSITIVITY_LEVELS.includes(payload.sensitivity_level)) return { valid: false };
    result.sensitivity_level = payload.sensitivity_level;
  }

  if (Array.isArray(payload?.tags)) {
    result.tags = payload.tags
      .filter((tag) => typeof tag === 'string')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (Object.keys(result).length === 0) return { valid: false };

  return { valid: true, ...result };
}

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 5 -- teracom-ai-backend's
// KnowledgeCreate schema requires non-blank title/content/source;
// document_type is optional and, when present, must be one of
// KNOWLEDGE_DOCUMENT_TYPES above (validated here so a bad value gets a
// same-origin 400 rather than round-tripping to the backend first).
export function parseKnowledgeCreatePayload(payload) {
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  const content = typeof payload?.content === 'string' ? payload.content.trim() : '';
  const source = typeof payload?.source === 'string' ? payload.source.trim() : '';
  // KnowledgeCreate requires organisation_id even though the backend
  // ignores it in favour of the session's own organisation_id — the
  // same quirk parseWorkerPayload already documents for WorkerCreate.
  const organisationId =
    typeof payload?.organisation_id === 'string' ? payload.organisation_id.trim() : '';

  if (!title || !content || !source || !organisationId) return { valid: false };

  const result = { title, content, source, organisation_id: organisationId };

  if (typeof payload?.document_type === 'string' && payload.document_type !== '') {
    if (!KNOWLEDGE_DOCUMENT_TYPES.includes(payload.document_type)) return { valid: false };
    result.document_type = payload.document_type;
  }

  return { valid: true, ...result };
}

export function parseGovernanceRuleSetPayload(payload) {
  const ruleType = GOVERNANCE_RULE_TYPES.includes(payload?.rule_type) ? payload.rule_type : '';
  if (!ruleType) return { valid: false };

  const ruleKey = typeof payload?.rule_key === 'string' ? payload.rule_key.trim() : '';
  if (!ruleKey) return { valid: false };

  if (payload?.rule_value === undefined) return { valid: false };

  return { valid: true, rule_type: ruleType, rule_key: ruleKey, rule_value: payload.rule_value };
}

// --- Settings & Security V1 -----------------------------------------------
// Mirrors backend services/settings_service.py's own allowed-key/allowed-
// value set exactly (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.5) -- this is
// the same fail-fast-at-the-boundary courtesy every other validated payload
// on this page gets, not a second source of truth the backend must also
// agree with independently.
export const PREFERENCES_THEMES = ['dark', 'light', 'system'];

// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec1.4 -- "customer" (default, every
// role) vs "administration" (opt-in, admin-tier and above only; that
// gate is enforced elsewhere -- client-side via isAtLeastRole() the
// same way every other admin-only nav item already is, and
// unconditionally server-side by every route this mode's own nav
// items point at, so this preference only ever changes what's
// advertised in navigation, never what's actually reachable).
export const NAVIGATION_MODES = ['customer', 'administration'];

function isPlainBooleanMap(value, allowedKeys) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (!keys.every((key) => allowedKeys.includes(key))) return false;
  return keys.every((key) => typeof value[key] === 'boolean');
}

export function parseUserSettingsUpdatePayload(payload) {
  const result = {};

  if (payload?.first_name !== undefined) {
    const value = typeof payload.first_name === 'string' ? payload.first_name.trim() : '';
    if (!value) return { valid: false };
    result.first_name = value;
  }

  if (payload?.last_name !== undefined) {
    const value = typeof payload.last_name === 'string' ? payload.last_name.trim() : '';
    if (!value) return { valid: false };
    result.last_name = value;
  }

  if (payload?.timezone !== undefined) {
    if (typeof payload.timezone !== 'string') return { valid: false };
    result.timezone = payload.timezone;
  }

  if (payload?.preferences !== undefined) {
    const preferences = payload.preferences;
    if (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences)) {
      return { valid: false };
    }

    const allowedTopKeys = ['theme', 'accessibility', 'dashboard', 'notifications', 'navigation'];
    if (!Object.keys(preferences).every((key) => allowedTopKeys.includes(key))) return { valid: false };

    if (preferences.theme !== undefined && !PREFERENCES_THEMES.includes(preferences.theme)) {
      return { valid: false };
    }
    if (preferences.accessibility !== undefined && !isPlainBooleanMap(preferences.accessibility, ['reduce_motion', 'larger_text'])) {
      return { valid: false };
    }
    if (preferences.dashboard !== undefined && !isPlainBooleanMap(preferences.dashboard, ['compact_density'])) {
      return { valid: false };
    }
    if (
      preferences.notifications !== undefined &&
      !isPlainBooleanMap(preferences.notifications, ['email_security_alerts', 'email_product_updates'])
    ) {
      return { valid: false };
    }
    if (preferences.navigation !== undefined) {
      const navigation = preferences.navigation;
      if (
        typeof navigation !== 'object' || navigation === null || Array.isArray(navigation) ||
        !Object.keys(navigation).every((key) => key === 'mode') ||
        (navigation.mode !== undefined && !NAVIGATION_MODES.includes(navigation.mode))
      ) {
        return { valid: false };
      }
    }

    result.preferences = preferences;
  }

  if (Object.keys(result).length === 0) return { valid: false };

  return { valid: true, ...result };
}

export function parseChangePasswordPayload(payload) {
  const currentPassword = typeof payload?.current_password === 'string' ? payload.current_password : '';
  const newPassword = typeof payload?.new_password === 'string' ? payload.new_password : '';

  if (!currentPassword || !newPassword) return { valid: false };

  return { valid: true, current_password: currentPassword, new_password: newPassword };
}

export function parseMfaConfirmPayload(payload) {
  const code = typeof payload?.code === 'string' ? payload.code.trim() : '';
  if (!code) return { valid: false };

  return { valid: true, code };
}

export function parseMfaDisablePayload(payload) {
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const code = typeof payload?.code === 'string' ? payload.code.trim() : '';

  if (!password || !code) return { valid: false };

  return { valid: true, password, code };
}

// Typed, narrower than parseGovernanceRuleSetPayload -- backs
// SecurityPolicyForm.js (Organisation Security: Enforce MFA, Session
// Policies, Security Policies), which only ever sets one of these three
// known rule_key values, each with a specific rule_value shape, not
// free-text rule_key/rule_value like GovernanceRuleForm.js.
const SECURITY_RULE_KEYS = ['enforce_mfa', 'session_timeout_minutes', 'password_min_length'];

export function parseSecurityPolicyPayload(payload) {
  const ruleKey = SECURITY_RULE_KEYS.includes(payload?.rule_key) ? payload.rule_key : '';
  if (!ruleKey) return { valid: false };

  if (ruleKey === 'enforce_mfa') {
    if (typeof payload?.rule_value?.required !== 'boolean') return { valid: false };
    return { valid: true, rule_key: ruleKey, rule_value: { required: payload.rule_value.required } };
  }

  if (ruleKey === 'session_timeout_minutes') {
    const minutes = Number(payload?.rule_value?.minutes);
    if (!Number.isInteger(minutes) || minutes < 5) return { valid: false };
    return { valid: true, rule_key: ruleKey, rule_value: { minutes } };
  }

  // password_min_length
  const length = Number(payload?.rule_value?.length);
  if (!Number.isInteger(length) || length < 6) return { valid: false };
  return { valid: true, rule_key: ruleKey, rule_value: { length } };
}

export function parseMfaLoginVerifyPayload(payload) {
  const challengeToken = typeof payload?.challenge_token === 'string' ? payload.challenge_token : '';
  const code = typeof payload?.code === 'string' ? payload.code.trim() : '';

  if (!challengeToken || !code) return { valid: false };

  return { valid: true, challenge_token: challengeToken, code };
}

// MULTI_ORGANISATION_PLATFORM_V1 -- WorkerPoolCreate: name/role/capacity
// required, capacity a positive integer (mirrors the backend's own
// schemas/worker_pool.py#WorkerPoolCreate validator).
export function parseWorkerPoolPayload(payload) {
  const required = _requireNonBlank(payload, ['name', 'role']);
  if (!required) return { valid: false };

  const capacity = Number(payload?.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) return { valid: false };

  return { valid: true, ...required, capacity };
}

// WorkerPoolAssignment -- explicit null clears a worker's pool
// assignment, mirroring the inline department_id convention
// app/api/portal/workers/[workerId]/department/route.js already uses
// (a bare empty string from a "no pool" <option> is treated the same
// way as an explicit null).
export function parseWorkerPoolAssignmentPayload(payload) {
  const workerPoolId =
    typeof payload?.worker_pool_id === 'string' && payload.worker_pool_id.trim()
      ? payload.worker_pool_id.trim()
      : null;

  return { valid: true, worker_pool_id: workerPoolId };
}

// MULTI_ORGANISATION_PLATFORM_V1 -- AIProviderConfigurationUpdate:
// provider required and must be one of the backend's own
// SUPPORTED_PROVIDERS (services/ai_provider_service.py); model_name
// optional free text. MODELROUTE1 (2026-08-27) added grok/openrouter
// and routing_mode. LITELLM_PRODUCTION_AND_MODEL_ROUTING_V1
// (2026-08-29) added deepseek/qwen -- real, native LiteLLM 1.98.0
// provider support confirmed directly against the installed package,
// not assumed.
export const AI_PROVIDERS = ['ollama', 'openai', 'anthropic', 'gemini', 'copilot', 'grok', 'openrouter', 'deepseek', 'qwen'];
export const AI_PROVIDER_CREDENTIAL_PROVIDERS = AI_PROVIDERS.filter((p) => p !== 'ollama');
export const AI_ROUTING_MODES = ['local_only', 'local_first', 'best_available', 'custom'];

// LITELLM_PRODUCTION_AND_MODEL_ROUTING_V1 Phase 4 -- mirrors the
// backend's own PURPOSES (services/ai_provider_service.py) exactly.
// Real values a Custom Routing rule may now target individually (a
// "Primary Model" per workload), not just the organisation-wide
// catch-all list.
export const AI_PURPOSES = [
  'worker_execution', 'orchestrator', 'persona', 'content', 'proposal',
  'video_script', 'requirements', 'cto_planning', 'memory_summary',
  'federation_consultation', 'consultation',
];

export function parseAIProviderConfigPayload(payload) {
  const provider = AI_PROVIDERS.includes(payload?.provider) ? payload.provider : '';
  if (!provider) return { valid: false };

  const modelName =
    typeof payload?.model_name === 'string' && payload.model_name.trim() ? payload.model_name.trim() : undefined;

  const routingMode = AI_ROUTING_MODES.includes(payload?.routing_mode) ? payload.routing_mode : undefined;

  return { valid: true, provider, model_name: modelName, routing_mode: routingMode };
}

export function parseAIProviderCredentialPayload(payload) {
  const apiKey = typeof payload?.api_key === 'string' ? payload.api_key.trim() : '';
  if (!apiKey) return { valid: false };
  return { valid: true, api_key: apiKey };
}

export function parseAIProviderRoutingRulesPayload(payload) {
  if (!Array.isArray(payload?.rules)) return { valid: false };

  const rules = [];
  for (const rule of payload.rules) {
    if (!AI_PROVIDERS.includes(rule?.provider)) return { valid: false };
    if (typeof rule?.priority !== 'number') return { valid: false };
    // LITELLM_PRODUCTION_AND_MODEL_ROUTING_V1 Phase 4 -- a real
    // purpose now passes through instead of always being forced to
    // null; the backend's own schema (schemas/ai_provider_routing_rule.py)
    // is the actual source of truth for "at most one rule per purpose"
    // and per-group priority uniqueness -- this is shape validation
    // only, same posture as every other field here.
    const purpose = AI_PURPOSES.includes(rule?.purpose) ? rule.purpose : null;
    rules.push({
      purpose,
      priority: rule.priority,
      provider: rule.provider,
      model_name: typeof rule?.model_name === 'string' && rule.model_name.trim() ? rule.model_name.trim() : undefined,
    });
  }

  return { valid: true, rules };
}
