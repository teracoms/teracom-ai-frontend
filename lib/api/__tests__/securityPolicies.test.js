import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchOrganisationSecurityPolicy,
  setOrganisationSecurityRule,
} = await import('../securityPolicies.js');

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

test('fetchOrganisationSecurityPolicy extracts only rule_type="security" entries into a fixed shape', async () => {
  mockFetch(async () =>
    new Response(
      JSON.stringify([
        { rule_type: 'governance', rule_key: 'approval_threshold_aud', value: 5000, is_overridden: false },
        { rule_type: 'security', rule_key: 'enforce_mfa', value: { required: true }, is_overridden: false },
        { rule_type: 'security', rule_key: 'session_timeout_minutes', value: { minutes: 60 }, is_overridden: false },
      ]),
      { status: 200 }
    )
  );

  const policy = await fetchOrganisationSecurityPolicy('tok');

  assert.equal(policy.enforce_mfa.value.required, true);
  assert.equal(policy.session_timeout_minutes.value.minutes, 60);
  assert.equal(policy.password_min_length, null);
});

test('setOrganisationSecurityRule POSTs rule_type="security" with the given rule_key/rule_value', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'r1' }), { status: 200 });
  });

  await setOrganisationSecurityRule('tok', 'session_timeout_minutes', { minutes: 30 });

  assert.deepEqual(seenBody, {
    rule_type: 'security',
    rule_key: 'session_timeout_minutes',
    rule_value: { minutes: 30 },
  });
});

test('setOrganisationSecurityRule rejects an unknown rule_key', async () => {
  await assert.rejects(() => setOrganisationSecurityRule('tok', 'not_a_real_key', {}));
});
