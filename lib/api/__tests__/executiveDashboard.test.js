import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchExecutiveDashboardSummary } = await import('../executiveDashboard.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

test('fetchExecutiveDashboardSummary GETs /executive-dashboard/summary', async () => {
  let seenUrl;
  global.fetch = async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({}), { status: 200 });
  };

  await fetchExecutiveDashboardSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/executive-dashboard/summary');
});
