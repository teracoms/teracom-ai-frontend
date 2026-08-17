import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchFederationProviders, fetchFederationSummary } = await import('../federation.js');

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

test('fetchFederationProviders GETs /federation/providers', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchFederationProviders('tok');

  assert.equal(seenUrl, 'https://backend.test/federation/providers');
});

test('fetchFederationSummary GETs /federation/summary', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ consultation_count_by_provider: {} }), { status: 200 });
  });

  await fetchFederationSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/federation/summary');
});
