import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchPortalContactProposals, fetchPortalContactQuotes, fetchPortalContactContracts } = await import(
  '../portalContactDeals.js'
);

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

test('fetchPortalContactProposals GETs /portal-contact/proposals', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPortalContactProposals('tok');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/proposals');
});

test('fetchPortalContactQuotes GETs /portal-contact/quotes', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPortalContactQuotes('tok');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/quotes');
});

test('fetchPortalContactContracts GETs /portal-contact/contracts', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPortalContactContracts('tok');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/contracts');
});
