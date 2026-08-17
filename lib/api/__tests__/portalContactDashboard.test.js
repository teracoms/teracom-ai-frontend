import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchPortalContactDashboard } = await import('../portalContactDashboard.js');

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

test('fetchPortalContactDashboard GETs /portal-contact/dashboard', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ proposals_count: 0 }), { status: 200 });
  });

  await fetchPortalContactDashboard('tok');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/dashboard');
});
