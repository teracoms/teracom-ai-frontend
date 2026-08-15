import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchConnectorStatus } = await import('../connectors.js');

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

test('fetchConnectorStatus calls GET /connector-status/ with the bearer token', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(
      JSON.stringify({ sharepoint: 'available', onedrive: 'available', teams: 'available' }),
      { status: 200 }
    );
  });

  const data = await fetchConnectorStatus('tok');

  assert.equal(seenUrl, 'https://backend.test/connector-status/');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.deepEqual(data, { sharepoint: 'available', onedrive: 'available', teams: 'available' });
});
