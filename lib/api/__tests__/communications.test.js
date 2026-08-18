import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchOrganisationCommunications, fetchContactCommunications } = await import('../communications.js');

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

test('fetchOrganisationCommunications GETs /organisation-notifications/ with the bearer token', async () => {
  let seenUrl;
  let seenAuth;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenAuth = init.headers.Authorization;
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchOrganisationCommunications('token-123');

  assert.equal(seenUrl, 'https://backend.test/organisation-notifications/');
  assert.equal(seenAuth, 'Bearer token-123');
});

test('fetchContactCommunications GETs /crm/contacts/{id}/communications', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchContactCommunications('token-123', 'contact-42');

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/contact-42/communications');
});
