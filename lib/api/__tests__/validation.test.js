import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseLoginCredentials,
  parseWorkerPayload,
  parseSearchQuery,
  parseChatMessage,
  parseConsultationSuggestPayload,
  parseConsultationExecutePayload,
  parseCtoPlanPayload,
  parseCtoExecutePayload,
  parseMemoryPayload,
  parseUserPayload,
  parseUserRoleUpdatePayload,
  parseUserStatusUpdatePayload,
  parsePermissionPayload,
  parseDepartmentPayload,
  parseDepartmentUpdatePayload,
  parseOrganisationMemoryPayload,
  parseDepartmentMemoryPayload,
  parseMemorySummaryRequestPayload,
  parseDepartmentHeadAssignmentPayload,
  parseDepartmentHeadConsultPayload,
  parseContactIntakePayload,
  parseContactStagePayload,
  parseContactHealthPayload,
  parseDealDocumentPayload,
  parseProposalDraftPayload,
  parseDealDecisionPayload,
  parseOnboardingSeedPayload,
  parseDepartmentFunctionPayload,
  parseCampaignPayload,
  parseCampaignStagePayload,
  parseMarketingProductionPayload,
  parseMarketingDraftPayload,
  parseMediaPublishPayload,
  parseFederationSuggestPayload,
  parseFederationConsultPayload,
  parseFederationEnabledPayload,
  parseFederationModePayload,
  parseDepartmentBudgetPayload,
  parseProposalCostEstimatePayload,
  parseProjectPayload,
  parseProjectStatusPayload,
  parseProjectPlanPayload,
  parseTaskPayload,
  parseTaskStatusPayload,
  parseSupportRequestPayload,
  parseSupportRequestStatusPayload,
  parseSupportRequestMessagePayload,
  parsePortalContactAccountPayload,
  parseWorkerCreationRequestPayload,
  parseWorkerStatusPayload,
  parseDeploymentRecordPayload,
  parsePlatformIncidentPayload,
  parsePlatformIncidentStatusPayload,
  parseGovernanceRuleSetPayload,
  parseKnowledgeMetadataPayload,
  parseKnowledgeCreatePayload,
  parseUserSettingsUpdatePayload,
  parseChangePasswordPayload,
  parseMfaConfirmPayload,
  parseMfaDisablePayload,
  parseMfaLoginVerifyPayload,
  parseSecurityPolicyPayload,
  parseWorkerPoolPayload,
  parseWorkerPoolAssignmentPayload,
  parseAIProviderConfigPayload,
  parseAIProviderCredentialPayload,
  parseAIProviderRoutingRulesPayload,
} from '../validation.js';

test('parseLoginCredentials accepts a well-formed payload', () => {
  const result = parseLoginCredentials({ email: 'user@example.com', password: 'hunter2' });
  assert.deepEqual(result, { valid: true, email: 'user@example.com', password: 'hunter2' });
});

test('parseLoginCredentials trims surrounding whitespace from email only', () => {
  const result = parseLoginCredentials({ email: '  user@example.com  ', password: ' hunter2 ' });
  assert.equal(result.valid, true);
  assert.equal(result.email, 'user@example.com');
  assert.equal(result.password, ' hunter2 ');
});

test('parseLoginCredentials rejects a missing email', () => {
  const result = parseLoginCredentials({ password: 'hunter2' });
  assert.equal(result.valid, false);
});

test('parseLoginCredentials rejects a missing password', () => {
  const result = parseLoginCredentials({ email: 'user@example.com' });
  assert.equal(result.valid, false);
});

test('parseLoginCredentials rejects an empty-string email after trimming', () => {
  const result = parseLoginCredentials({ email: '   ', password: 'hunter2' });
  assert.equal(result.valid, false);
});

test('parseLoginCredentials rejects non-string fields instead of throwing', () => {
  const result = parseLoginCredentials({ email: 12345, password: { not: 'a string' } });
  assert.equal(result.valid, false);
  assert.equal(result.email, '');
  assert.equal(result.password, '');
});

test('parseLoginCredentials rejects a null/undefined payload instead of throwing', () => {
  assert.equal(parseLoginCredentials(null).valid, false);
  assert.equal(parseLoginCredentials(undefined).valid, false);
});

test('parseWorkerPayload accepts a well-formed payload and trims text fields', () => {
  const result = parseWorkerPayload({
    name: '  Estimator  ',
    role: ' Estimation Assistant ',
    purpose: ' Helps with quotes ',
    instructions: ' Be concise ',
    status: 'inactive',
    organisation_id: 'org-1',
  });

  assert.deepEqual(result, {
    valid: true,
    name: 'Estimator',
    role: 'Estimation Assistant',
    purpose: 'Helps with quotes',
    instructions: 'Be concise',
    status: 'inactive',
    organisation_id: 'org-1',
  });
});

test('parseWorkerPayload defaults an unrecognised status to "active"', () => {
  const result = parseWorkerPayload({
    name: 'A',
    role: 'B',
    purpose: 'C',
    instructions: 'D',
    status: 'deleted',
    organisation_id: 'org-1',
  });
  assert.equal(result.status, 'active');
});

test('parseWorkerPayload defaults a missing status to "active"', () => {
  const result = parseWorkerPayload({
    name: 'A',
    role: 'B',
    purpose: 'C',
    instructions: 'D',
    organisation_id: 'org-1',
  });
  assert.equal(result.status, 'active');
});

test('parseWorkerPayload rejects a payload missing any required text field', () => {
  const base = { name: 'A', role: 'B', purpose: 'C', instructions: 'D', organisation_id: 'org-1' };

  for (const key of ['name', 'role', 'purpose', 'instructions', 'organisation_id']) {
    const result = parseWorkerPayload({ ...base, [key]: '' });
    assert.equal(result.valid, false, `expected invalid when ${key} is empty`);
  }
});

test('parseWorkerPayload rejects a null/undefined payload instead of throwing', () => {
  assert.equal(parseWorkerPayload(null).valid, false);
  assert.equal(parseWorkerPayload(undefined).valid, false);
});

test('parseSearchQuery accepts and trims a well-formed query', () => {
  const result = parseSearchQuery({ query: '  vendor pricing  ' });
  assert.deepEqual(result, { valid: true, query: 'vendor pricing' });
});

test('parseSearchQuery rejects a missing, empty or whitespace-only query', () => {
  assert.equal(parseSearchQuery({}).valid, false);
  assert.equal(parseSearchQuery({ query: '' }).valid, false);
  assert.equal(parseSearchQuery({ query: '   ' }).valid, false);
});

test('parseSearchQuery rejects a non-string query and a null/undefined payload instead of throwing', () => {
  assert.equal(parseSearchQuery({ query: 12345 }).valid, false);
  assert.equal(parseSearchQuery(null).valid, false);
  assert.equal(parseSearchQuery(undefined).valid, false);
});

test('parseChatMessage accepts and trims a well-formed payload', () => {
  const result = parseChatMessage({ worker_id: ' w1 ', message: '  Hi there  ' });
  assert.deepEqual(result, { valid: true, worker_id: 'w1', message: 'Hi there' });
});

test('parseChatMessage rejects a missing worker_id or message', () => {
  assert.equal(parseChatMessage({ message: 'Hi' }).valid, false);
  assert.equal(parseChatMessage({ worker_id: 'w1' }).valid, false);
  assert.equal(parseChatMessage({ worker_id: '', message: '' }).valid, false);
});

test('parseChatMessage rejects a whitespace-only message and a null/undefined payload instead of throwing', () => {
  assert.equal(parseChatMessage({ worker_id: 'w1', message: '   ' }).valid, false);
  assert.equal(parseChatMessage(null).valid, false);
  assert.equal(parseChatMessage(undefined).valid, false);
});

test('parseConsultationSuggestPayload accepts and trims a well-formed payload', () => {
  const result = parseConsultationSuggestPayload({ primary_worker_id: ' w1 ', message: '  Hi  ' });
  assert.deepEqual(result, { valid: true, primary_worker_id: 'w1', message: 'Hi' });
});

test('parseConsultationSuggestPayload rejects a missing primary_worker_id or message', () => {
  assert.equal(parseConsultationSuggestPayload({ message: 'Hi' }).valid, false);
  assert.equal(parseConsultationSuggestPayload({ primary_worker_id: 'w1' }).valid, false);
});

test('parseConsultationSuggestPayload rejects a whitespace-only message and a null/undefined payload instead of throwing', () => {
  assert.equal(parseConsultationSuggestPayload({ primary_worker_id: 'w1', message: '   ' }).valid, false);
  assert.equal(parseConsultationSuggestPayload(null).valid, false);
  assert.equal(parseConsultationSuggestPayload(undefined).valid, false);
});

test('parseConsultationExecutePayload accepts and trims a well-formed payload', () => {
  const result = parseConsultationExecutePayload({
    primary_worker_id: ' w1 ',
    consulted_worker_id: ' w2 ',
    message: '  Hi  ',
  });
  assert.deepEqual(result, {
    valid: true,
    primary_worker_id: 'w1',
    consulted_worker_id: 'w2',
    message: 'Hi',
  });
});

test('parseConsultationExecutePayload rejects a payload missing any required field', () => {
  const base = { primary_worker_id: 'w1', consulted_worker_id: 'w2', message: 'Hi' };
  for (const key of ['primary_worker_id', 'consulted_worker_id', 'message']) {
    const result = parseConsultationExecutePayload({ ...base, [key]: '' });
    assert.equal(result.valid, false, `expected invalid when ${key} is empty`);
  }
  assert.equal(parseConsultationExecutePayload(null).valid, false);
  assert.equal(parseConsultationExecutePayload(undefined).valid, false);
});

test('parseCtoPlanPayload accepts and trims a well-formed payload', () => {
  const result = parseCtoPlanPayload({ primary_worker_id: ' w1 ', objective: '  Review our firewall.  ' });
  assert.deepEqual(result, {
    valid: true,
    primary_worker_id: 'w1',
    objective: 'Review our firewall.',
    max_hops: undefined,
  });
});

test('parseCtoPlanPayload passes through a valid positive integer max_hops', () => {
  const result = parseCtoPlanPayload({ primary_worker_id: 'w1', objective: 'Review.', max_hops: 3 });
  assert.equal(result.max_hops, 3);
});

test('parseCtoPlanPayload ignores a non-integer or non-positive max_hops', () => {
  assert.equal(parseCtoPlanPayload({ primary_worker_id: 'w1', objective: 'Review.', max_hops: 0 }).max_hops, undefined);
  assert.equal(parseCtoPlanPayload({ primary_worker_id: 'w1', objective: 'Review.', max_hops: -1 }).max_hops, undefined);
  assert.equal(parseCtoPlanPayload({ primary_worker_id: 'w1', objective: 'Review.', max_hops: 'three' }).max_hops, undefined);
});

test('parseCtoPlanPayload rejects a missing primary_worker_id or objective, and a null/undefined payload', () => {
  assert.equal(parseCtoPlanPayload({ objective: 'Review.' }).valid, false);
  assert.equal(parseCtoPlanPayload({ primary_worker_id: 'w1' }).valid, false);
  assert.equal(parseCtoPlanPayload(null).valid, false);
  assert.equal(parseCtoPlanPayload(undefined).valid, false);
});

test('parseCtoExecutePayload accepts a well-formed payload with no steps', () => {
  const result = parseCtoExecutePayload({ primary_worker_id: ' w1 ', objective: ' Review our firewall. ' });
  assert.deepEqual(result, {
    valid: true,
    primary_worker_id: 'w1',
    objective: 'Review our firewall.',
    steps: undefined,
  });
});

test('parseCtoExecutePayload accepts and trims a well-formed steps array', () => {
  const result = parseCtoExecutePayload({
    primary_worker_id: 'w1',
    objective: 'Review our firewall.',
    steps: [{ worker_id: ' w2 ', subtask: ' Check it. ' }],
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.steps, [{ worker_id: 'w2', subtask: 'Check it.' }]);
});

test('parseCtoExecutePayload rejects a steps array containing an incomplete entry', () => {
  const result = parseCtoExecutePayload({
    primary_worker_id: 'w1',
    objective: 'Review our firewall.',
    steps: [{ worker_id: 'w2', subtask: '' }],
  });
  assert.equal(result.valid, false);
});

test('parseCtoExecutePayload rejects a missing primary_worker_id or objective, and a null/undefined payload', () => {
  assert.equal(parseCtoExecutePayload({ objective: 'Review.' }).valid, false);
  assert.equal(parseCtoExecutePayload({ primary_worker_id: 'w1' }).valid, false);
  assert.equal(parseCtoExecutePayload(null).valid, false);
  assert.equal(parseCtoExecutePayload(undefined).valid, false);
});

test('parseMemoryPayload accepts and trims a well-formed payload', () => {
  const result = parseMemoryPayload({ worker_id: ' w1 ', memory: '  Preferred vendor is Acme  ' });
  assert.deepEqual(result, { valid: true, worker_id: 'w1', memory: 'Preferred vendor is Acme' });
});

test('parseMemoryPayload rejects a missing worker_id or memory', () => {
  assert.equal(parseMemoryPayload({ memory: 'A fact' }).valid, false);
  assert.equal(parseMemoryPayload({ worker_id: 'w1' }).valid, false);
  assert.equal(parseMemoryPayload({ worker_id: '', memory: '' }).valid, false);
});

test('parseMemoryPayload rejects a whitespace-only memory and a null/undefined payload instead of throwing', () => {
  assert.equal(parseMemoryPayload({ worker_id: 'w1', memory: '   ' }).valid, false);
  assert.equal(parseMemoryPayload(null).valid, false);
  assert.equal(parseMemoryPayload(undefined).valid, false);
});

test('parseUserPayload accepts a well-formed payload and trims text fields', () => {
  const result = parseUserPayload({
    first_name: ' Jane ',
    last_name: ' Doe ',
    email: ' jane@example.com ',
    password: 'hunter2',
    role: 'admin',
    organisation_id: ' org-1 ',
  });

  assert.deepEqual(result, {
    valid: true,
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    password: 'hunter2',
    role: 'admin',
    organisation_id: 'org-1',
  });
});

test('parseUserPayload accepts every Human Authority Model role and defaults an unrecognised or missing one to "employee"', () => {
  const base = {
    first_name: 'A',
    last_name: 'B',
    email: 'a@example.com',
    password: 'x',
    organisation_id: 'org-1',
  };
  for (const role of ['owner', 'admin', 'manager', 'employee', 'read_only']) {
    assert.equal(parseUserPayload({ ...base, role }).role, role);
  }
  assert.equal(parseUserPayload({ ...base, role: 'member' }).role, 'employee');
  assert.equal(parseUserPayload(base).role, 'employee');
});

test('parseUserPayload rejects a payload missing any required field', () => {
  const base = {
    first_name: 'A',
    last_name: 'B',
    email: 'a@example.com',
    password: 'x',
    organisation_id: 'org-1',
  };

  for (const key of ['first_name', 'last_name', 'email', 'password', 'organisation_id']) {
    const result = parseUserPayload({ ...base, [key]: '' });
    assert.equal(result.valid, false, `expected invalid when ${key} is empty`);
  }
});

test('parseUserPayload rejects a null/undefined payload instead of throwing', () => {
  assert.equal(parseUserPayload(null).valid, false);
  assert.equal(parseUserPayload(undefined).valid, false);
});

test('parseUserRoleUpdatePayload accepts every Human Authority Model role and rejects anything else', () => {
  for (const role of ['owner', 'admin', 'manager', 'employee', 'read_only']) {
    assert.deepEqual(parseUserRoleUpdatePayload({ role }), { valid: true, role });
  }
  assert.equal(parseUserRoleUpdatePayload({ role: 'member' }).valid, false);
  assert.equal(parseUserRoleUpdatePayload({}).valid, false);
  assert.equal(parseUserRoleUpdatePayload(null).valid, false);
});

test('parseUserStatusUpdatePayload accepts "active"/"inactive" and rejects anything else', () => {
  assert.deepEqual(parseUserStatusUpdatePayload({ status: 'active' }), { valid: true, status: 'active' });
  assert.deepEqual(parseUserStatusUpdatePayload({ status: 'inactive' }), { valid: true, status: 'inactive' });
  assert.equal(parseUserStatusUpdatePayload({ status: 'disabled' }).valid, false);
  assert.equal(parseUserStatusUpdatePayload({}).valid, false);
  assert.equal(parseUserStatusUpdatePayload(null).valid, false);
});

test('parsePermissionPayload accepts and trims a well-formed payload', () => {
  const result = parsePermissionPayload({ worker_id: ' w1 ', knowledge_id: ' k1 ' });
  assert.deepEqual(result, { valid: true, worker_id: 'w1', knowledge_id: 'k1' });
});

test('parsePermissionPayload rejects a missing worker_id or knowledge_id, and a null/undefined payload instead of throwing', () => {
  assert.equal(parsePermissionPayload({ knowledge_id: 'k1' }).valid, false);
  assert.equal(parsePermissionPayload({ worker_id: 'w1' }).valid, false);
  assert.equal(parsePermissionPayload(null).valid, false);
  assert.equal(parsePermissionPayload(undefined).valid, false);
});

test('parseDepartmentPayload accepts and trims a well-formed payload, omitting description when blank', () => {
  assert.deepEqual(parseDepartmentPayload({ name: ' Engineering ' }), {
    valid: true,
    name: 'Engineering',
    description: undefined,
    purpose: undefined,
    function: undefined,
  });
  assert.deepEqual(parseDepartmentPayload({ name: 'Engineering', description: ' Infra. ' }), {
    valid: true,
    name: 'Engineering',
    description: 'Infra.',
    purpose: undefined,
    function: undefined,
  });
});

test('parseDepartmentPayload accepts and trims purpose/function', () => {
  assert.deepEqual(
    parseDepartmentPayload({ name: 'Engineering', purpose: ' Ship the product. ', function: 'engineering' }),
    {
      valid: true,
      name: 'Engineering',
      description: undefined,
      purpose: 'Ship the product.',
      function: 'engineering',
    }
  );
});

test('parseDepartmentPayload rejects a blank name, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDepartmentPayload({ name: '  ' }).valid, false);
  assert.equal(parseDepartmentPayload(null).valid, false);
  assert.equal(parseDepartmentPayload(undefined).valid, false);
});

test('parseDepartmentUpdatePayload includes only the fields present, trimmed', () => {
  assert.deepEqual(parseDepartmentUpdatePayload({ name: ' Engineering ' }), {
    valid: true,
    name: 'Engineering',
  });
  assert.deepEqual(parseDepartmentUpdatePayload({ description: ' Infra. ', purpose: ' Ship it. ' }), {
    valid: true,
    description: 'Infra.',
    purpose: 'Ship it.',
  });
});

test('parseDepartmentUpdatePayload rejects a blank name, an empty payload, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDepartmentUpdatePayload({ name: '  ' }).valid, false);
  assert.equal(parseDepartmentUpdatePayload({}).valid, false);
  assert.equal(parseDepartmentUpdatePayload(null).valid, false);
  assert.equal(parseDepartmentUpdatePayload(undefined).valid, false);
});

test('parseOrganisationMemoryPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(parseOrganisationMemoryPayload({ memory: ' Our HQ is in Sydney. ' }), {
    valid: true,
    memory: 'Our HQ is in Sydney.',
  });
});

test('parseOrganisationMemoryPayload rejects a blank memory, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseOrganisationMemoryPayload({ memory: '  ' }).valid, false);
  assert.equal(parseOrganisationMemoryPayload(null).valid, false);
  assert.equal(parseOrganisationMemoryPayload(undefined).valid, false);
});

test('parseDepartmentMemoryPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(
    parseDepartmentMemoryPayload({ department_id: ' d1 ', memory: ' We prefer Cisco. ' }),
    { valid: true, department_id: 'd1', memory: 'We prefer Cisco.' }
  );
});

test('parseDepartmentMemoryPayload rejects a missing department_id or memory, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDepartmentMemoryPayload({ memory: 'x' }).valid, false);
  assert.equal(parseDepartmentMemoryPayload({ department_id: 'd1' }).valid, false);
  assert.equal(parseDepartmentMemoryPayload(null).valid, false);
  assert.equal(parseDepartmentMemoryPayload(undefined).valid, false);
});

test('parseMemorySummaryRequestPayload accepts a valid scope and scope_id', () => {
  assert.deepEqual(parseMemorySummaryRequestPayload({ scope: 'department', scope_id: ' d1 ' }), {
    valid: true,
    scope: 'department',
    scope_id: 'd1',
  });
});

test('parseMemorySummaryRequestPayload rejects an unknown scope, a blank scope_id, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseMemorySummaryRequestPayload({ scope: 'team', scope_id: 'd1' }).valid, false);
  assert.equal(parseMemorySummaryRequestPayload({ scope: 'department', scope_id: '  ' }).valid, false);
  assert.equal(parseMemorySummaryRequestPayload(null).valid, false);
  assert.equal(parseMemorySummaryRequestPayload(undefined).valid, false);
});

test('parseDepartmentHeadAssignmentPayload accepts a trimmed worker_id or an explicit null', () => {
  assert.deepEqual(parseDepartmentHeadAssignmentPayload({ worker_id: ' w1 ' }), { valid: true, worker_id: 'w1' });
  assert.deepEqual(parseDepartmentHeadAssignmentPayload({ worker_id: null }), { valid: true, worker_id: null });
});

test('parseDepartmentHeadAssignmentPayload rejects a blank/missing worker_id and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDepartmentHeadAssignmentPayload({ worker_id: '  ' }).valid, false);
  assert.equal(parseDepartmentHeadAssignmentPayload({}).valid, false);
  assert.equal(parseDepartmentHeadAssignmentPayload(null).valid, false);
  assert.equal(parseDepartmentHeadAssignmentPayload(undefined).valid, false);
});

test('parseDepartmentHeadConsultPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(
    parseDepartmentHeadConsultPayload({ primary_worker_id: ' w1 ', consulted_worker_id: ' w2 ', message: ' Hi ' }),
    { valid: true, primary_worker_id: 'w1', consulted_worker_id: 'w2', message: 'Hi' }
  );
});

test('parseDepartmentHeadConsultPayload rejects a missing field, and a null/undefined payload instead of throwing', () => {
  const base = { primary_worker_id: 'w1', consulted_worker_id: 'w2', message: 'Hi' };
  for (const key of ['primary_worker_id', 'consulted_worker_id', 'message']) {
    assert.equal(parseDepartmentHeadConsultPayload({ ...base, [key]: '' }).valid, false, `expected invalid when ${key} is empty`);
  }
  assert.equal(parseDepartmentHeadConsultPayload(null).valid, false);
  assert.equal(parseDepartmentHeadConsultPayload(undefined).valid, false);
});

test('parseContactIntakePayload accepts and trims a well-formed payload, omitting optional fields when blank', () => {
  assert.deepEqual(parseContactIntakePayload({ name: ' Alex ' }), {
    valid: true,
    name: 'Alex',
    company: undefined,
    email: undefined,
    phone: undefined,
    source: undefined,
  });
  assert.deepEqual(parseContactIntakePayload({ name: 'Alex', company: ' Acme ' }), {
    valid: true,
    name: 'Alex',
    company: 'Acme',
    email: undefined,
    phone: undefined,
    source: undefined,
  });
});

test('parseContactIntakePayload rejects a blank name, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseContactIntakePayload({ name: '  ' }).valid, false);
  assert.equal(parseContactIntakePayload(null).valid, false);
  assert.equal(parseContactIntakePayload(undefined).valid, false);
});

test('parseContactStagePayload accepts a valid stage and rejects an unknown one', () => {
  assert.deepEqual(parseContactStagePayload({ stage: 'lead' }), { valid: true, stage: 'lead' });
  assert.equal(parseContactStagePayload({ stage: 'won' }).valid, false);
  assert.equal(parseContactStagePayload(null).valid, false);
});

test('parseContactHealthPayload accepts a valid health status and rejects an unknown one', () => {
  assert.deepEqual(parseContactHealthPayload({ health_status: 'at_risk' }), { valid: true, health_status: 'at_risk' });
  assert.equal(parseContactHealthPayload({ health_status: 'great' }).valid, false);
  assert.equal(parseContactHealthPayload(null).valid, false);
});

test('parseDealDocumentPayload accepts and trims a well-formed payload, including an optional numeric amount', () => {
  assert.deepEqual(
    parseDealDocumentPayload({ crm_contact_id: ' c1 ', title: ' T ', content: ' C ', amount: 500 }),
    { valid: true, crm_contact_id: 'c1', title: 'T', content: 'C', amount: 500 }
  );
});

test('parseDealDocumentPayload rejects a missing required field, and a null/undefined payload instead of throwing', () => {
  const base = { crm_contact_id: 'c1', title: 'T', content: 'C' };
  for (const key of ['crm_contact_id', 'title', 'content']) {
    assert.equal(parseDealDocumentPayload({ ...base, [key]: '' }).valid, false, `expected invalid when ${key} is empty`);
  }
  assert.equal(parseDealDocumentPayload(null).valid, false);
  assert.equal(parseDealDocumentPayload(undefined).valid, false);
});

test('parseProposalDraftPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(
    parseProposalDraftPayload({ crm_contact_id: 'c1', title: 'T', brief: 'B', worker_id: 'w1' }),
    { valid: true, crm_contact_id: 'c1', title: 'T', brief: 'B', worker_id: 'w1' }
  );
});

test('parseProposalDraftPayload rejects a missing required field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseProposalDraftPayload({ crm_contact_id: 'c1', title: 'T', brief: 'B' }).valid, false);
  assert.equal(parseProposalDraftPayload(null).valid, false);
  assert.equal(parseProposalDraftPayload(undefined).valid, false);
});

test('parseDealDecisionPayload accepts "approved"/"rejected" and an optional notes field', () => {
  assert.deepEqual(parseDealDecisionPayload({ decision: 'approved' }), {
    valid: true,
    decision: 'approved',
    notes: undefined,
  });
  assert.deepEqual(parseDealDecisionPayload({ decision: 'rejected', notes: ' Not now ' }), {
    valid: true,
    decision: 'rejected',
    notes: 'Not now',
  });
});

test('parseDealDecisionPayload rejects an unknown decision, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDealDecisionPayload({ decision: 'maybe' }).valid, false);
  assert.equal(parseDealDecisionPayload(null).valid, false);
  assert.equal(parseDealDecisionPayload(undefined).valid, false);
});

test('parseOnboardingSeedPayload accepts a trimmed crm_contact_id and rejects a blank one', () => {
  assert.deepEqual(parseOnboardingSeedPayload({ crm_contact_id: ' c1 ' }), { valid: true, crm_contact_id: 'c1' });
  assert.equal(parseOnboardingSeedPayload({ crm_contact_id: '  ' }).valid, false);
  assert.equal(parseOnboardingSeedPayload(null).valid, false);
});

test('parseDepartmentFunctionPayload accepts "sales"/"customer_success"/"marketing"/"finance"/"operations"/null and rejects anything else', () => {
  assert.deepEqual(parseDepartmentFunctionPayload({ function: 'sales' }), { valid: true, function: 'sales' });
  assert.deepEqual(parseDepartmentFunctionPayload({ function: 'marketing' }), { valid: true, function: 'marketing' });
  assert.deepEqual(parseDepartmentFunctionPayload({ function: 'finance' }), { valid: true, function: 'finance' });
  assert.deepEqual(parseDepartmentFunctionPayload({ function: 'operations' }), { valid: true, function: 'operations' });
  assert.deepEqual(parseDepartmentFunctionPayload({ function: null }), { valid: true, function: null });
  assert.equal(parseDepartmentFunctionPayload({ function: 'engineering' }).valid, false);
  assert.equal(parseDepartmentFunctionPayload(undefined).valid, false);
});

test('parseCampaignPayload accepts and trims a well-formed payload, omitting optional fields when blank', () => {
  assert.deepEqual(parseCampaignPayload({ name: ' Q3 Launch ' }), {
    valid: true,
    name: 'Q3 Launch',
    objective: undefined,
    owner_worker_id: undefined,
  });
  assert.deepEqual(parseCampaignPayload({ name: 'Q3 Launch', objective: ' Grow awareness ' }), {
    valid: true,
    name: 'Q3 Launch',
    objective: 'Grow awareness',
    owner_worker_id: undefined,
  });
});

test('parseCampaignPayload rejects a blank name, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseCampaignPayload({ name: '  ' }).valid, false);
  assert.equal(parseCampaignPayload(null).valid, false);
  assert.equal(parseCampaignPayload(undefined).valid, false);
});

test('parseCampaignStagePayload accepts a valid stage and rejects an unknown one', () => {
  assert.deepEqual(parseCampaignStagePayload({ stage: 'active' }), { valid: true, stage: 'active' });
  assert.equal(parseCampaignStagePayload({ stage: 'archived' }).valid, false);
  assert.equal(parseCampaignStagePayload(null).valid, false);
});

test('parseMarketingProductionPayload accepts and trims a well-formed payload for a given bodyField', () => {
  assert.deepEqual(
    parseMarketingProductionPayload({ campaign_id: ' c1 ', title: ' T ', content: ' C ' }, 'content'),
    { valid: true, campaign_id: 'c1', title: 'T', content: 'C', content_piece_id: undefined }
  );
  assert.deepEqual(
    parseMarketingProductionPayload({ campaign_id: 'c1', title: 'T', script: 'S', content_piece_id: 'p1' }, 'script'),
    { valid: true, campaign_id: 'c1', title: 'T', script: 'S', content_piece_id: 'p1' }
  );
});

test('parseMarketingProductionPayload rejects a missing required field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseMarketingProductionPayload({ campaign_id: 'c1', title: 'T', content: '' }, 'content').valid, false);
  assert.equal(parseMarketingProductionPayload(null, 'content').valid, false);
  assert.equal(parseMarketingProductionPayload(undefined, 'script').valid, false);
});

test('parseMarketingDraftPayload requires brief only when requireBrief is true', () => {
  assert.deepEqual(
    parseMarketingDraftPayload({ campaign_id: 'c1', title: 'T', brief: 'B', worker_id: 'w1' }, { requireBrief: true }),
    { valid: true, campaign_id: 'c1', title: 'T', brief: 'B', worker_id: 'w1', content_piece_id: undefined }
  );
  assert.equal(
    parseMarketingDraftPayload({ campaign_id: 'c1', title: 'T', worker_id: 'w1' }, { requireBrief: true }).valid,
    false
  );
  assert.deepEqual(
    parseMarketingDraftPayload({ campaign_id: 'c1', title: 'T', worker_id: 'w1' }, { requireBrief: false }),
    { valid: true, campaign_id: 'c1', title: 'T', worker_id: 'w1', content_piece_id: undefined }
  );
});

test('parseMediaPublishPayload accepts a valid kind/title and rejects a missing or invalid one', () => {
  assert.deepEqual(
    parseMediaPublishPayload({ kind: 'video', title: 'T', video_asset_id: 'v1' }),
    { valid: true, kind: 'video', title: 'T', content_piece_id: undefined, video_asset_id: 'v1' }
  );
  assert.equal(parseMediaPublishPayload({ kind: 'audio', title: 'T' }).valid, false);
  assert.equal(parseMediaPublishPayload({ kind: 'content', title: '  ' }).valid, false);
  assert.equal(parseMediaPublishPayload(null).valid, false);
});

test('parseFederationSuggestPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(parseFederationSuggestPayload({ worker_id: ' w1 ', message: ' Help me ' }), {
    valid: true,
    worker_id: 'w1',
    message: 'Help me',
  });
});

test('parseFederationSuggestPayload rejects a missing field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseFederationSuggestPayload({ worker_id: 'w1' }).valid, false);
  assert.equal(parseFederationSuggestPayload(null).valid, false);
  assert.equal(parseFederationSuggestPayload(undefined).valid, false);
});

test('parseFederationConsultPayload accepts and trims a well-formed payload, with an optional federation_provider_id', () => {
  assert.deepEqual(parseFederationConsultPayload({ worker_id: 'w1', message: 'Help' }), {
    valid: true,
    worker_id: 'w1',
    message: 'Help',
    federation_provider_id: undefined,
  });
  assert.deepEqual(parseFederationConsultPayload({ worker_id: 'w1', message: 'Help', federation_provider_id: ' p1 ' }), {
    valid: true,
    worker_id: 'w1',
    message: 'Help',
    federation_provider_id: 'p1',
  });
});

test('parseFederationConsultPayload rejects a missing required field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseFederationConsultPayload({ worker_id: 'w1' }).valid, false);
  assert.equal(parseFederationConsultPayload(null).valid, false);
  assert.equal(parseFederationConsultPayload(undefined).valid, false);
});

test('parseFederationEnabledPayload accepts a boolean and rejects anything else', () => {
  assert.deepEqual(parseFederationEnabledPayload({ federation_enabled: true }), { valid: true, federation_enabled: true });
  assert.deepEqual(parseFederationEnabledPayload({ federation_enabled: false }), { valid: true, federation_enabled: false });
  assert.equal(parseFederationEnabledPayload({ federation_enabled: 'yes' }).valid, false);
  assert.equal(parseFederationEnabledPayload(null).valid, false);
});

test('parseFederationModePayload accepts each valid mode and rejects anything else', () => {
  assert.deepEqual(parseFederationModePayload({ federation_mode: 'internal_only' }), { valid: true, federation_mode: 'internal_only' });
  assert.deepEqual(parseFederationModePayload({ federation_mode: 'internal_and_internet' }), { valid: true, federation_mode: 'internal_and_internet' });
  assert.deepEqual(parseFederationModePayload({ federation_mode: 'external_providers' }), { valid: true, federation_mode: 'external_providers' });
  assert.equal(parseFederationModePayload({ federation_mode: 'anything_else' }).valid, false);
  assert.equal(parseFederationModePayload(null).valid, false);
});

test('parseDepartmentBudgetPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(
    parseDepartmentBudgetPayload({ department_id: ' d1 ', period_label: ' Q3 2026 ', amount_allocated: 5000 }),
    { valid: true, department_id: 'd1', period_label: 'Q3 2026', amount_allocated: 5000 }
  );
});

test('parseDepartmentBudgetPayload rejects a missing field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDepartmentBudgetPayload({ department_id: 'd1', period_label: 'Q3 2026' }).valid, false);
  assert.equal(parseDepartmentBudgetPayload({ department_id: 'd1', period_label: '', amount_allocated: 5000 }).valid, false);
  assert.equal(parseDepartmentBudgetPayload(null).valid, false);
  assert.equal(parseDepartmentBudgetPayload(undefined).valid, false);
});

test('parseProposalCostEstimatePayload accepts a number and rejects anything else', () => {
  assert.deepEqual(parseProposalCostEstimatePayload({ internal_cost_estimate: 1200.5 }), {
    valid: true,
    internal_cost_estimate: 1200.5,
  });
  assert.equal(parseProposalCostEstimatePayload({ internal_cost_estimate: '1200' }).valid, false);
  assert.equal(parseProposalCostEstimatePayload(null).valid, false);
});

test('parseProjectPayload accepts a name-only payload and trims optional fields', () => {
  assert.deepEqual(parseProjectPayload({ name: ' Office Relocation ' }), {
    valid: true,
    name: 'Office Relocation',
    description: undefined,
    department_id: undefined,
  });
  assert.deepEqual(parseProjectPayload({ name: 'Office Relocation', description: ' Move HQ ', department_id: ' d1 ' }), {
    valid: true,
    name: 'Office Relocation',
    description: 'Move HQ',
    department_id: 'd1',
  });
});

test('parseProjectPayload rejects a blank name, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseProjectPayload({ name: '  ' }).valid, false);
  assert.equal(parseProjectPayload(null).valid, false);
  assert.equal(parseProjectPayload(undefined).valid, false);
});

test('parseProjectStatusPayload accepts "active"/"completed"/"blocked"/"archived" and rejects anything else', () => {
  assert.deepEqual(parseProjectStatusPayload({ status: 'active' }), { valid: true, status: 'active' });
  assert.deepEqual(parseProjectStatusPayload({ status: 'completed' }), { valid: true, status: 'completed' });
  // AUTONOMOUS_PROJECTS_V1's real bidirectional lifecycle -- ProjectPanel.js's
  // own status <select> already offered this value, but this array silently
  // rejected it until DIGITAL_ORGANISATION_UX_V1 found and fixed the gap.
  assert.deepEqual(parseProjectStatusPayload({ status: 'blocked' }), { valid: true, status: 'blocked' });
  // CUSTOMER_UX_ACCEPTANCE_V1 -- "archived" is now a real status
  // (schemas/project.py's own Literal extended, no DB migration
  // needed -- a plain String(50) column with no CHECK constraint).
  assert.deepEqual(parseProjectStatusPayload({ status: 'archived' }), { valid: true, status: 'archived' });
  assert.equal(parseProjectStatusPayload({ status: 'not-a-real-status' }).valid, false);
  assert.equal(parseProjectStatusPayload(null).valid, false);
});

test('parseTaskPayload accepts a required-fields-only payload and trims optional fields', () => {
  assert.deepEqual(parseTaskPayload({ project_id: ' p1 ', title: ' Book movers ' }), {
    valid: true,
    project_id: 'p1',
    title: 'Book movers',
    description: undefined,
    assignee_worker_id: undefined,
    assignee_worker_pool_id: undefined,
    due_date: undefined,
    priority: undefined,
  });
  assert.deepEqual(
    parseTaskPayload({
      project_id: 'p1',
      title: 'Book movers',
      description: ' Details ',
      assignee_worker_id: ' w1 ',
      due_date: '2026-09-01',
      priority: ' high ',
    }),
    {
      valid: true,
      project_id: 'p1',
      title: 'Book movers',
      description: 'Details',
      assignee_worker_id: 'w1',
      assignee_worker_pool_id: undefined,
      due_date: '2026-09-01',
      priority: 'high',
    }
  );
});

// MULTI_ORGANISATION_PLATFORM_V1 -- a task may name a Worker Pool
// instead of one fixed worker.
test('parseTaskPayload accepts assignee_worker_pool_id and trims it', () => {
  assert.deepEqual(
    parseTaskPayload({ project_id: 'p1', title: 'Book movers', assignee_worker_pool_id: ' pool1 ' }),
    {
      valid: true,
      project_id: 'p1',
      title: 'Book movers',
      description: undefined,
      assignee_worker_id: undefined,
      assignee_worker_pool_id: 'pool1',
      due_date: undefined,
      priority: undefined,
    }
  );
});

test('parseTaskPayload rejects a missing required field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseTaskPayload({ project_id: 'p1' }).valid, false);
  assert.equal(parseTaskPayload({ title: 'Book movers' }).valid, false);
  assert.equal(parseTaskPayload(null).valid, false);
  assert.equal(parseTaskPayload(undefined).valid, false);
});

test('parseTaskStatusPayload accepts "pending"/"in_progress"/"done"/"failed" and rejects anything else', () => {
  assert.deepEqual(parseTaskStatusPayload({ status: 'pending' }), { valid: true, status: 'pending' });
  assert.deepEqual(parseTaskStatusPayload({ status: 'in_progress' }), { valid: true, status: 'in_progress' });
  assert.deepEqual(parseTaskStatusPayload({ status: 'done' }), { valid: true, status: 'done' });
  // AUTONOMOUS_ORGANISATION_V1 — "failed" is now a real status,
  // system-set on a verification failure but also human-settable.
  assert.deepEqual(parseTaskStatusPayload({ status: 'failed' }), { valid: true, status: 'failed' });
  assert.equal(parseTaskStatusPayload({ status: 'blocked' }).valid, false);
  assert.equal(parseTaskStatusPayload(null).valid, false);
});

test('parseProjectPlanPayload accepts a required-fields-only payload and trims department_id', () => {
  assert.deepEqual(
    parseProjectPlanPayload({ primary_worker_id: ' w1 ', objective: ' Do the thing. ', name: ' New Project ' }),
    { valid: true, primary_worker_id: 'w1', objective: 'Do the thing.', name: 'New Project', department_id: undefined },
  );
  assert.deepEqual(
    parseProjectPlanPayload({
      primary_worker_id: 'w1', objective: 'Do the thing.', name: 'New Project', department_id: ' d1 ',
    }),
    { valid: true, primary_worker_id: 'w1', objective: 'Do the thing.', name: 'New Project', department_id: 'd1' },
  );
});

test('parseProjectPlanPayload rejects a missing required field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseProjectPlanPayload({ objective: 'x', name: 'y' }).valid, false);
  assert.equal(parseProjectPlanPayload({ primary_worker_id: 'w1', name: 'y' }).valid, false);
  assert.equal(parseProjectPlanPayload({ primary_worker_id: 'w1', objective: 'x' }).valid, false);
  assert.equal(parseProjectPlanPayload(null).valid, false);
  assert.equal(parseProjectPlanPayload(undefined).valid, false);
});

test('parseSupportRequestPayload accepts a valid request_type and trims subject/description', () => {
  assert.deepEqual(
    parseSupportRequestPayload({ request_type: 'incident', subject: ' Outage ', description: ' Down ' }),
    { valid: true, request_type: 'incident', subject: 'Outage', description: 'Down' }
  );
});

test('parseSupportRequestPayload rejects an invalid request_type, a missing field, and a null/undefined payload', () => {
  assert.equal(parseSupportRequestPayload({ request_type: 'bug', subject: 'X', description: 'Y' }).valid, false);
  assert.equal(parseSupportRequestPayload({ request_type: 'support', subject: 'X' }).valid, false);
  assert.equal(parseSupportRequestPayload(null).valid, false);
  assert.equal(parseSupportRequestPayload(undefined).valid, false);
});

test('parseSupportRequestStatusPayload accepts "open"/"in_progress"/"resolved"/"closed" and rejects anything else', () => {
  assert.deepEqual(parseSupportRequestStatusPayload({ status: 'open' }), { valid: true, status: 'open' });
  assert.deepEqual(parseSupportRequestStatusPayload({ status: 'resolved' }), { valid: true, status: 'resolved' });
  assert.equal(parseSupportRequestStatusPayload({ status: 'archived' }).valid, false);
  assert.equal(parseSupportRequestStatusPayload(null).valid, false);
});

test('parseSupportRequestMessagePayload accepts a trimmed body and rejects a blank one', () => {
  assert.deepEqual(parseSupportRequestMessagePayload({ body: ' Hello ' }), { valid: true, body: 'Hello' });
  assert.equal(parseSupportRequestMessagePayload({ body: '  ' }).valid, false);
  assert.equal(parseSupportRequestMessagePayload(null).valid, false);
});

test('parsePortalContactAccountPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(parsePortalContactAccountPayload({ email: ' a@example.com ', password: ' secret123 ' }), {
    valid: true,
    email: 'a@example.com',
    password: 'secret123',
  });
});

test('parsePortalContactAccountPayload rejects a missing field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parsePortalContactAccountPayload({ email: 'a@example.com' }).valid, false);
  assert.equal(parsePortalContactAccountPayload(null).valid, false);
  assert.equal(parsePortalContactAccountPayload(undefined).valid, false);
});

test('parseWorkerCreationRequestPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(
    parseWorkerCreationRequestPayload({
      name: ' Analyst ',
      role: ' Analyst ',
      purpose: ' Analyses things. ',
      instructions: ' Be precise. ',
    }),
    { valid: true, name: 'Analyst', role: 'Analyst', purpose: 'Analyses things.', instructions: 'Be precise.' }
  );
});

test('parseWorkerCreationRequestPayload rejects a missing field, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseWorkerCreationRequestPayload({ name: 'A', role: 'B', purpose: 'C' }).valid, false);
  assert.equal(parseWorkerCreationRequestPayload(null).valid, false);
  assert.equal(parseWorkerCreationRequestPayload(undefined).valid, false);
});

test('parseWorkerStatusPayload accepts "active"/"inactive" and rejects anything else', () => {
  assert.deepEqual(parseWorkerStatusPayload({ status: 'active' }), { valid: true, status: 'active' });
  assert.deepEqual(parseWorkerStatusPayload({ status: 'inactive' }), { valid: true, status: 'inactive' });
  assert.equal(parseWorkerStatusPayload({ status: 'archived' }).valid, false);
  assert.equal(parseWorkerStatusPayload(null).valid, false);
});

test('parseDeploymentRecordPayload accepts a version-label-only payload and trims optional description', () => {
  assert.deepEqual(parseDeploymentRecordPayload({ version_label: ' v1.0.0 ' }), {
    valid: true,
    version_label: 'v1.0.0',
    description: undefined,
  });
  assert.deepEqual(parseDeploymentRecordPayload({ version_label: 'v1.0.0', description: ' Release. ' }), {
    valid: true,
    version_label: 'v1.0.0',
    description: 'Release.',
  });
});

test('parseDeploymentRecordPayload rejects a blank version_label, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDeploymentRecordPayload({ version_label: '  ' }).valid, false);
  assert.equal(parseDeploymentRecordPayload(null).valid, false);
  assert.equal(parseDeploymentRecordPayload(undefined).valid, false);
});

test('parsePlatformIncidentPayload accepts and trims a well-formed payload', () => {
  assert.deepEqual(
    parsePlatformIncidentPayload({ title: ' Outage ', description: ' Down. ', severity: 'high' }),
    { valid: true, title: 'Outage', description: 'Down.', severity: 'high' }
  );
});

test('parsePlatformIncidentPayload rejects an invalid severity, a missing field, and a null/undefined payload', () => {
  assert.equal(parsePlatformIncidentPayload({ title: 'A', description: 'B', severity: 'extreme' }).valid, false);
  assert.equal(parsePlatformIncidentPayload({ title: 'A', severity: 'high' }).valid, false);
  assert.equal(parsePlatformIncidentPayload(null).valid, false);
  assert.equal(parsePlatformIncidentPayload(undefined).valid, false);
});

test('parsePlatformIncidentStatusPayload accepts "open"/"monitoring"/"resolved" and rejects anything else', () => {
  assert.deepEqual(parsePlatformIncidentStatusPayload({ status: 'open' }), { valid: true, status: 'open' });
  assert.deepEqual(parsePlatformIncidentStatusPayload({ status: 'monitoring' }), { valid: true, status: 'monitoring' });
  assert.deepEqual(parsePlatformIncidentStatusPayload({ status: 'resolved' }), { valid: true, status: 'resolved' });
  assert.equal(parsePlatformIncidentStatusPayload({ status: 'closed' }).valid, false);
  assert.equal(parsePlatformIncidentStatusPayload(null).valid, false);
});

test('parseGovernanceRuleSetPayload accepts every known rule_type and every JSON value type for rule_value', () => {
  for (const ruleType of ['governance', 'policy', 'standards', 'knowledge_assignment']) {
    assert.deepEqual(
      parseGovernanceRuleSetPayload({ rule_type: ruleType, rule_key: 'k', rule_value: 'v' }),
      { valid: true, rule_type: ruleType, rule_key: 'k', rule_value: 'v' }
    );
  }

  assert.equal(
    parseGovernanceRuleSetPayload({ rule_type: 'governance', rule_key: 'k', rule_value: 5000 }).rule_value,
    5000
  );
  assert.equal(
    parseGovernanceRuleSetPayload({ rule_type: 'governance', rule_key: 'k', rule_value: false }).rule_value,
    false
  );
  assert.deepEqual(
    parseGovernanceRuleSetPayload({ rule_type: 'governance', rule_key: 'k', rule_value: ['a', 'b'] }).rule_value,
    ['a', 'b']
  );
});

test('parseGovernanceRuleSetPayload rejects an unknown rule_type, a blank rule_key, a missing rule_value, and a null/undefined payload', () => {
  assert.equal(
    parseGovernanceRuleSetPayload({ rule_type: 'bogus', rule_key: 'k', rule_value: 'v' }).valid,
    false
  );
  assert.equal(
    parseGovernanceRuleSetPayload({ rule_type: 'governance', rule_key: '  ', rule_value: 'v' }).valid,
    false
  );
  assert.equal(
    parseGovernanceRuleSetPayload({ rule_type: 'governance', rule_key: 'k' }).valid,
    false
  );
  assert.equal(parseGovernanceRuleSetPayload(null).valid, false);
  assert.equal(parseGovernanceRuleSetPayload(undefined).valid, false);
});

test('parseKnowledgeMetadataPayload accepts any one field alone, and all three together', () => {
  assert.deepEqual(parseKnowledgeMetadataPayload({ document_type: 'policy' }), {
    valid: true,
    document_type: 'policy',
  });
  assert.deepEqual(parseKnowledgeMetadataPayload({ sensitivity_level: 'internal' }), {
    valid: true,
    sensitivity_level: 'internal',
  });
  assert.deepEqual(parseKnowledgeMetadataPayload({ tags: [' a ', '', 'b'] }), {
    valid: true,
    tags: ['a', 'b'],
  });
  assert.deepEqual(
    parseKnowledgeMetadataPayload({ document_type: 'general', sensitivity_level: 'public', tags: [] }),
    { valid: true, document_type: 'general', sensitivity_level: 'public', tags: [] }
  );
});

test('parseKnowledgeMetadataPayload rejects an unknown document_type/sensitivity_level and an empty or null/undefined payload', () => {
  assert.equal(parseKnowledgeMetadataPayload({ document_type: 'bogus' }).valid, false);
  assert.equal(parseKnowledgeMetadataPayload({ sensitivity_level: 'bogus' }).valid, false);
  assert.equal(parseKnowledgeMetadataPayload({}).valid, false);
  assert.equal(parseKnowledgeMetadataPayload(null).valid, false);
  assert.equal(parseKnowledgeMetadataPayload(undefined).valid, false);
});

test('parseKnowledgeCreatePayload accepts and trims a well-formed payload, with and without document_type', () => {
  assert.deepEqual(
    parseKnowledgeCreatePayload({
      title: ' Refund Policy ',
      content: ' Body. ',
      source: ' upload ',
      organisation_id: ' org-1 ',
    }),
    { valid: true, title: 'Refund Policy', content: 'Body.', source: 'upload', organisation_id: 'org-1' }
  );
  assert.deepEqual(
    parseKnowledgeCreatePayload({
      title: 'Onboarding SOP',
      content: 'Steps.',
      source: 'wizard',
      organisation_id: 'org-1',
      document_type: 'sop',
    }),
    {
      valid: true,
      title: 'Onboarding SOP',
      content: 'Steps.',
      source: 'wizard',
      organisation_id: 'org-1',
      document_type: 'sop',
    }
  );
});

test('parseKnowledgeCreatePayload rejects a missing field, an unknown document_type, and a null/undefined payload', () => {
  assert.equal(parseKnowledgeCreatePayload({ title: 'T', content: 'C', organisation_id: 'org-1' }).valid, false);
  assert.equal(
    parseKnowledgeCreatePayload({
      title: 'T',
      content: 'C',
      source: 'S',
      organisation_id: 'org-1',
      document_type: 'bogus',
    }).valid,
    false
  );
  assert.equal(
    parseKnowledgeCreatePayload({ title: 'T', content: 'C', source: 'S' }).valid,
    false
  );
  assert.equal(parseKnowledgeCreatePayload({}).valid, false);
  assert.equal(parseKnowledgeCreatePayload(null).valid, false);
  assert.equal(parseKnowledgeCreatePayload(undefined).valid, false);
});

// --- Settings & Security V1 -------------------------------------------

test('parseUserSettingsUpdatePayload accepts profile fields, timezone, and a valid preferences patch', () => {
  assert.deepEqual(parseUserSettingsUpdatePayload({ first_name: '  New  ' }), {
    valid: true,
    first_name: 'New',
  });
  assert.deepEqual(parseUserSettingsUpdatePayload({ timezone: 'Australia/Sydney' }), {
    valid: true,
    timezone: 'Australia/Sydney',
  });
  assert.deepEqual(parseUserSettingsUpdatePayload({ timezone: '' }), { valid: true, timezone: '' });
  assert.deepEqual(
    parseUserSettingsUpdatePayload({ preferences: { theme: 'dark', dashboard: { compact_density: true } } }),
    { valid: true, preferences: { theme: 'dark', dashboard: { compact_density: true } } }
  );
});

test('parseUserSettingsUpdatePayload rejects a blank name, an empty payload, and an invalid preferences shape', () => {
  assert.equal(parseUserSettingsUpdatePayload({ first_name: '   ' }).valid, false);
  assert.equal(parseUserSettingsUpdatePayload({}).valid, false);
  assert.equal(parseUserSettingsUpdatePayload({ preferences: { theme: 'purple' } }).valid, false);
  assert.equal(parseUserSettingsUpdatePayload({ preferences: { not_a_real_key: true } }).valid, false);
  assert.equal(parseUserSettingsUpdatePayload({ preferences: { accessibility: { reduce_motion: 'yes' } } }).valid, false);
  assert.equal(parseUserSettingsUpdatePayload(null).valid, false);
  assert.equal(parseUserSettingsUpdatePayload(undefined).valid, false);
});

test('parseChangePasswordPayload accepts a well-formed payload and rejects a missing field', () => {
  assert.deepEqual(parseChangePasswordPayload({ current_password: 'a', new_password: 'b' }), {
    valid: true,
    current_password: 'a',
    new_password: 'b',
  });
  assert.equal(parseChangePasswordPayload({ current_password: 'a' }).valid, false);
  assert.equal(parseChangePasswordPayload(null).valid, false);
});

test('parseMfaConfirmPayload accepts a trimmed code and rejects a blank one', () => {
  assert.deepEqual(parseMfaConfirmPayload({ code: ' 123456 ' }), { valid: true, code: '123456' });
  assert.equal(parseMfaConfirmPayload({ code: '' }).valid, false);
  assert.equal(parseMfaConfirmPayload(null).valid, false);
});

test('parseMfaDisablePayload accepts password+code and rejects either missing', () => {
  assert.deepEqual(parseMfaDisablePayload({ password: 'pw', code: '123456' }), {
    valid: true,
    password: 'pw',
    code: '123456',
  });
  assert.equal(parseMfaDisablePayload({ password: 'pw' }).valid, false);
  assert.equal(parseMfaDisablePayload({ code: '123456' }).valid, false);
});

test('parseMfaLoginVerifyPayload accepts challenge_token+code and rejects either missing', () => {
  assert.deepEqual(parseMfaLoginVerifyPayload({ challenge_token: 't', code: '123456' }), {
    valid: true,
    challenge_token: 't',
    code: '123456',
  });
  assert.equal(parseMfaLoginVerifyPayload({ challenge_token: 't' }).valid, false);
  assert.equal(parseMfaLoginVerifyPayload({ code: '123456' }).valid, false);
});

test('parseSecurityPolicyPayload accepts each known rule_key with its own valid shape', () => {
  assert.deepEqual(parseSecurityPolicyPayload({ rule_key: 'enforce_mfa', rule_value: { required: true } }), {
    valid: true,
    rule_key: 'enforce_mfa',
    rule_value: { required: true },
  });
  assert.deepEqual(
    parseSecurityPolicyPayload({ rule_key: 'session_timeout_minutes', rule_value: { minutes: 30 } }),
    { valid: true, rule_key: 'session_timeout_minutes', rule_value: { minutes: 30 } }
  );
  assert.deepEqual(
    parseSecurityPolicyPayload({ rule_key: 'password_min_length', rule_value: { length: 12 } }),
    { valid: true, rule_key: 'password_min_length', rule_value: { length: 12 } }
  );
});

test('parseSecurityPolicyPayload rejects an unknown rule_key and an out-of-range value', () => {
  assert.equal(parseSecurityPolicyPayload({ rule_key: 'bogus', rule_value: {} }).valid, false);
  assert.equal(
    parseSecurityPolicyPayload({ rule_key: 'session_timeout_minutes', rule_value: { minutes: 1 } }).valid,
    false
  );
  assert.equal(
    parseSecurityPolicyPayload({ rule_key: 'password_min_length', rule_value: { length: 3 } }).valid,
    false
  );
  assert.equal(parseSecurityPolicyPayload({ rule_key: 'enforce_mfa', rule_value: { required: 'yes' } }).valid, false);
});

test('parseWorkerPoolPayload accepts a well-formed payload and trims name/role', () => {
  assert.deepEqual(parseWorkerPoolPayload({ name: ' Developer Pool ', role: ' Software Developer ', capacity: 5 }), {
    valid: true,
    name: 'Developer Pool',
    role: 'Software Developer',
    capacity: 5,
  });
});

test('parseWorkerPoolPayload rejects a missing field, a non-integer capacity, and a capacity below 1', () => {
  assert.equal(parseWorkerPoolPayload({ role: 'QA', capacity: 2 }).valid, false);
  assert.equal(parseWorkerPoolPayload({ name: 'QA Pool', capacity: 2 }).valid, false);
  assert.equal(parseWorkerPoolPayload({ name: 'QA Pool', role: 'QA', capacity: 'many' }).valid, false);
  assert.equal(parseWorkerPoolPayload({ name: 'QA Pool', role: 'QA', capacity: 0 }).valid, false);
});

test('parseWorkerPoolAssignmentPayload trims a given pool id and treats blank/missing as null', () => {
  assert.deepEqual(parseWorkerPoolAssignmentPayload({ worker_pool_id: ' pool1 ' }), {
    valid: true,
    worker_pool_id: 'pool1',
  });
  assert.deepEqual(parseWorkerPoolAssignmentPayload({ worker_pool_id: null }), { valid: true, worker_pool_id: null });
  assert.deepEqual(parseWorkerPoolAssignmentPayload({}), { valid: true, worker_pool_id: null });
});

test('parseAIProviderConfigPayload accepts each known provider and rejects an unknown one', () => {
  assert.deepEqual(parseAIProviderConfigPayload({ provider: 'ollama' }), {
    valid: true,
    provider: 'ollama',
    model_name: undefined,
    routing_mode: undefined,
  });
  assert.deepEqual(parseAIProviderConfigPayload({ provider: 'gemini', model_name: ' gemini-pro ' }), {
    valid: true,
    provider: 'gemini',
    model_name: 'gemini-pro',
    routing_mode: undefined,
  });
  assert.equal(parseAIProviderConfigPayload({ provider: 'not-a-real-provider' }).valid, false);
  assert.equal(parseAIProviderConfigPayload(null).valid, false);
});

test('parseAIProviderConfigPayload accepts a valid routing_mode and ignores an unknown one', () => {
  assert.deepEqual(parseAIProviderConfigPayload({ provider: 'ollama', routing_mode: 'best_available' }), {
    valid: true,
    provider: 'ollama',
    model_name: undefined,
    routing_mode: 'best_available',
  });
  assert.equal(
    parseAIProviderConfigPayload({ provider: 'ollama', routing_mode: 'not-a-real-mode' }).routing_mode,
    undefined
  );
});

test('parseAIProviderCredentialPayload requires a non-empty api_key', () => {
  assert.deepEqual(parseAIProviderCredentialPayload({ api_key: '  sk-real-key  ' }), {
    valid: true,
    api_key: 'sk-real-key',
  });
  assert.equal(parseAIProviderCredentialPayload({ api_key: '   ' }).valid, false);
  assert.equal(parseAIProviderCredentialPayload({}).valid, false);
  assert.equal(parseAIProviderCredentialPayload(null).valid, false);
});

test('parseAIProviderRoutingRulesPayload passes through a real purpose and nulls an unrecognised one', () => {
  // LITELLM_PRODUCTION_AND_MODEL_ROUTING_V1 Phase 4 -- a real purpose
  // now passes through (previously always forced to null); an
  // unrecognised one still safely falls back to null (the catch-all
  // group) rather than being rejected outright here -- the backend's
  // own schema is the real source of truth for "must be a known
  // purpose", this is shape validation only.
  const result = parseAIProviderRoutingRulesPayload({
    rules: [
      { purpose: 'orchestrator', priority: 1, provider: 'anthropic', model_name: ' claude ' },
      { priority: 2, provider: 'ollama' },
      { purpose: 'not-a-real-purpose', priority: 3, provider: 'deepseek' },
    ],
  });
  assert.deepEqual(result, {
    valid: true,
    rules: [
      { purpose: 'orchestrator', priority: 1, provider: 'anthropic', model_name: 'claude' },
      { purpose: null, priority: 2, provider: 'ollama', model_name: undefined },
      { purpose: null, priority: 3, provider: 'deepseek', model_name: undefined },
    ],
  });

  assert.equal(parseAIProviderRoutingRulesPayload({ rules: [{ priority: 1, provider: 'not-real' }] }).valid, false);
  assert.equal(parseAIProviderRoutingRulesPayload({ rules: [{ provider: 'ollama' }] }).valid, false);
  assert.equal(parseAIProviderRoutingRulesPayload({}).valid, false);
});
