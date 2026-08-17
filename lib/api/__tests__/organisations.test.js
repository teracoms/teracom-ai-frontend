import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { setFederationEnabled } = await import('../organisations.js');

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

test('setFederationEnabled PATCHes {federation_enabled} to /organisations/federation-enabled', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ federation_enabled: false }), { status: 200 });
  });

  await setFederationEnabled('tok', false);

  assert.equal(seenUrl, 'https://backend.test/organisations/federation-enabled');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { federation_enabled: false });
});
