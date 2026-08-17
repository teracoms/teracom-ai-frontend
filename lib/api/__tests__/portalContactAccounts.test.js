import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { createPortalAccountForContact, fetchPortalAccountForContact } = await import('../portalContactAccounts.js');

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

test('createPortalAccountForContact POSTs the payload to /crm/contacts/{id}/portal-account', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1' }), { status: 200 });
  });

  await createPortalAccountForContact('tok', 'c1', { email: 'a@example.com', password: 'secret123' });

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/c1/portal-account');
  assert.deepEqual(seenBody, { email: 'a@example.com', password: 'secret123' });
});

test('fetchPortalAccountForContact GETs /crm/contacts/{id}/portal-account', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify(null), { status: 200 });
  });

  await fetchPortalAccountForContact('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/c1/portal-account');
});
