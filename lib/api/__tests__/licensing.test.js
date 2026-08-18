import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { createLicenceRequest, fetchLicenceRequests, fetchEntitlement } = await import('../licensing.js');

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

test('createLicenceRequest POSTs the payload to /licensing/requests', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'req1' }), { status: 200 });
  });

  await createLicenceRequest('tok', { request_type: 'worker_pack', pack_size: 5, quantity: 1 });

  assert.equal(seenUrl, 'https://backend.test/licensing/requests');
  assert.deepEqual(seenBody, { request_type: 'worker_pack', pack_size: 5, quantity: 1 });
});

test('fetchLicenceRequests GETs /licensing/requests', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchLicenceRequests('tok');

  assert.equal(seenUrl, 'https://backend.test/licensing/requests');
});

test('fetchEntitlement GETs /licensing/entitlements/{licenceId}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ worker_limit: 5 }), { status: 200 });
  });

  await fetchEntitlement('tok', 'lic-1');

  assert.equal(seenUrl, 'https://backend.test/licensing/entitlements/lic-1');
});
