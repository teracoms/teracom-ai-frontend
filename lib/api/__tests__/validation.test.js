import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseLoginCredentials,
  parseWorkerPayload,
  parseSearchQuery,
  parseChatMessage,
  parseMemoryPayload,
  parseUserPayload,
  parsePermissionPayload,
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
