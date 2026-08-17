import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  createPortalContactSupportRequest,
  fetchPortalContactSupportRequests,
  fetchPortalContactSupportRequest,
  postPortalContactSupportRequestMessage,
  fetchPortalContactSupportRequestMessages,
} = await import('../portalContactSupportRequests.js');

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

test('createPortalContactSupportRequest POSTs the payload to /portal-contact/support-requests/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'r1' }), { status: 200 });
  });

  await createPortalContactSupportRequest('tok', { request_type: 'support', subject: 'Help', description: '...' });

  assert.equal(seenUrl, 'https://backend.test/portal-contact/support-requests/');
  assert.deepEqual(seenBody, { request_type: 'support', subject: 'Help', description: '...' });
});

test('fetchPortalContactSupportRequests GETs /portal-contact/support-requests/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPortalContactSupportRequests('tok');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/support-requests/');
});

test('fetchPortalContactSupportRequest GETs /portal-contact/support-requests/{id}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'r1' }), { status: 200 });
  });

  await fetchPortalContactSupportRequest('tok', 'r1');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/support-requests/r1');
});

test('postPortalContactSupportRequestMessage POSTs {body} to /portal-contact/support-requests/{id}/messages', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'm1' }), { status: 200 });
  });

  await postPortalContactSupportRequestMessage('tok', 'r1', 'Hello');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/support-requests/r1/messages');
  assert.deepEqual(seenBody, { body: 'Hello' });
});

test('fetchPortalContactSupportRequestMessages GETs /portal-contact/support-requests/{id}/messages', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPortalContactSupportRequestMessages('tok', 'r1');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/support-requests/r1/messages');
});
