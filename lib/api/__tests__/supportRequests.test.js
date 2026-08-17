import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchSupportRequests,
  fetchSupportRequest,
  updateSupportRequestStatus,
  postSupportRequestMessage,
  fetchSupportRequestMessages,
} = await import('../supportRequests.js');

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

test('fetchSupportRequests GETs /support-requests/, including filters as query params', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchSupportRequests('tok', { crm_contact_id: 'c1', status: 'open' });

  assert.equal(seenUrl, 'https://backend.test/support-requests/?crm_contact_id=c1&status=open');
});

test('fetchSupportRequests omits filters when none given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchSupportRequests('tok');

  assert.equal(seenUrl, 'https://backend.test/support-requests/');
});

test('fetchSupportRequest GETs /support-requests/{id}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'r1' }), { status: 200 });
  });

  await fetchSupportRequest('tok', 'r1');

  assert.equal(seenUrl, 'https://backend.test/support-requests/r1');
});

test('updateSupportRequestStatus PATCHes {status} to /support-requests/{id}/status', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'r1', status: 'resolved' }), { status: 200 });
  });

  await updateSupportRequestStatus('tok', 'r1', 'resolved');

  assert.equal(seenUrl, 'https://backend.test/support-requests/r1/status');
  assert.deepEqual(seenBody, { status: 'resolved' });
});

test('postSupportRequestMessage POSTs {body} to /support-requests/{id}/messages', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'm1' }), { status: 200 });
  });

  await postSupportRequestMessage('tok', 'r1', 'On it');

  assert.equal(seenUrl, 'https://backend.test/support-requests/r1/messages');
  assert.deepEqual(seenBody, { body: 'On it' });
});

test('fetchSupportRequestMessages GETs /support-requests/{id}/messages', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchSupportRequestMessages('tok', 'r1');

  assert.equal(seenUrl, 'https://backend.test/support-requests/r1/messages');
});
