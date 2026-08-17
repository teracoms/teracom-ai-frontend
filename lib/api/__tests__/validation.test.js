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
  parsePermissionPayload,
  parseDepartmentPayload,
  parseOrganisationMemoryPayload,
  parseDepartmentMemoryPayload,
  parseMemorySummaryRequestPayload,
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

test('parseUserPayload defaults an unrecognised or missing role to "member"', () => {
  const base = {
    first_name: 'A',
    last_name: 'B',
    email: 'a@example.com',
    password: 'x',
    organisation_id: 'org-1',
  };
  assert.equal(parseUserPayload({ ...base, role: 'owner' }).role, 'member');
  assert.equal(parseUserPayload(base).role, 'member');
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
  });
  assert.deepEqual(parseDepartmentPayload({ name: 'Engineering', description: ' Infra. ' }), {
    valid: true,
    name: 'Engineering',
    description: 'Infra.',
  });
});

test('parseDepartmentPayload rejects a blank name, and a null/undefined payload instead of throwing', () => {
  assert.equal(parseDepartmentPayload({ name: '  ' }).valid, false);
  assert.equal(parseDepartmentPayload(null).valid, false);
  assert.equal(parseDepartmentPayload(undefined).valid, false);
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
