import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchOrganisationHealthSummary } = await import('../organisationHealth.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

test('fetchOrganisationHealthSummary GETs /organisation-health/summary', async () => {
  let seenUrl;
  global.fetch = async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({}), { status: 200 });
  };

  await fetchOrganisationHealthSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/organisation-health/summary');
});
