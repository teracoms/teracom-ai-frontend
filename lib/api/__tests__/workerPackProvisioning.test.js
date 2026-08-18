import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { provisionWorkerPack, fetchProvisioningHistory } = await import('../workerPackProvisioning.js');

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

test('provisionWorkerPack POSTs {worker_pack_slug} to /worker-pack-provisioning/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ provisioning: {}, workers: [] }), { status: 201 });
  });

  await provisionWorkerPack('tok', 'retail-pack');

  assert.equal(seenUrl, 'https://backend.test/worker-pack-provisioning/');
  assert.deepEqual(seenBody, { worker_pack_slug: 'retail-pack' });
});

test('fetchProvisioningHistory GETs /worker-pack-provisioning/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchProvisioningHistory('tok');

  assert.equal(seenUrl, 'https://backend.test/worker-pack-provisioning/');
});
