import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchGovernancePolicies,
  setOrganisationGovernanceRule,
  fetchDepartmentGovernanceRules,
  setDepartmentGovernanceOverride,
} = await import('../governancePolicies.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

function mockFetch(handler) {
  global.fetch = async (url, init) => handler(url, init);
}

test('fetchGovernancePolicies GETs /governance-policies/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ policies: [] }), { status: 200 });
  });

  await fetchGovernancePolicies('tok');

  assert.equal(seenUrl, 'https://backend.test/governance-policies/');
});

test('setOrganisationGovernanceRule POSTs rule_type/rule_key/rule_value to /governance-rules/organisation', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'r1' }), { status: 200 });
  });

  await setOrganisationGovernanceRule('tok', {
    rule_type: 'governance',
    rule_key: 'approval_threshold_aud',
    rule_value: 5000,
  });

  assert.equal(seenUrl, 'https://backend.test/governance-rules/organisation');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, {
    rule_type: 'governance',
    rule_key: 'approval_threshold_aud',
    rule_value: 5000,
  });
});

test('fetchDepartmentGovernanceRules GETs /governance-rules/departments/{id}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchDepartmentGovernanceRules('tok', 'dept-1');

  assert.equal(seenUrl, 'https://backend.test/governance-rules/departments/dept-1');
});

test('setDepartmentGovernanceOverride POSTs rule_type/rule_key/rule_value to /governance-rules/departments/{id}', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'r2' }), { status: 200 });
  });

  await setDepartmentGovernanceOverride('tok', 'dept-1', {
    rule_type: 'policy',
    rule_key: 'support_response_sla_hours',
    rule_value: 24,
  });

  assert.equal(seenUrl, 'https://backend.test/governance-rules/departments/dept-1');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, {
    rule_type: 'policy',
    rule_key: 'support_response_sla_hours',
    rule_value: 24,
  });
});
