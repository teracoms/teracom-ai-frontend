import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchPlatformHealthSummary } = await import('../platformHealth.js');

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

test('fetchPlatformHealthSummary GETs /platform-health/summary', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ status: 'operational' }), { status: 200 });
  });

  await fetchPlatformHealthSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/platform-health/summary');
});
