import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchGovernancePolicies } = await import('../governancePolicies.js');

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
