import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchOrganisationalIntelligenceSummary } = await import('../organisationalIntelligence.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

test('fetchOrganisationalIntelligenceSummary GETs /organisational-intelligence/summary', async () => {
  let seenUrl;
  global.fetch = async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({}), { status: 200 });
  };

  await fetchOrganisationalIntelligenceSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/organisational-intelligence/summary');
});
