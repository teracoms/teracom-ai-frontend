import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchOperationsSummary } = await import('../operations.js');

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

test('fetchOperationsSummary GETs /operations/summary', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ projects: {} }), { status: 200 });
  });

  await fetchOperationsSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/operations/summary');
});
