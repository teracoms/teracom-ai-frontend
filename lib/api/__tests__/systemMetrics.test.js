import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchSystemMetricsSummary } = await import('../systemMetrics.js');

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

test('fetchSystemMetricsSummary GETs /system-metrics/summary with the bearer token', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(JSON.stringify({ cpu: { percent: 10, core_count: 4 } }), { status: 200 });
  });

  await fetchSystemMetricsSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/system-metrics/summary');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
});
