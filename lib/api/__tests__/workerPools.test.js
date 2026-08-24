import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchWorkerPools, createWorkerPool, assignWorkerToPool } = await import('../workerPools.js');

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

test('fetchWorkerPools GETs /worker-pools/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchWorkerPools('tok');

  assert.equal(seenUrl, 'https://backend.test/worker-pools/');
});

test('createWorkerPool POSTs the payload to /worker-pools/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'pool1' }), { status: 200 });
  });

  await createWorkerPool('tok', { name: 'Developer Pool', role: 'Software Developer', capacity: 5 });

  assert.equal(seenUrl, 'https://backend.test/worker-pools/');
  assert.deepEqual(seenBody, { name: 'Developer Pool', role: 'Software Developer', capacity: 5 });
});

test('assignWorkerToPool PATCHes {worker_pool_id} to /worker-pools/workers/{id}', async () => {
  let seenUrl;
  let seenBody;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'w1', worker_pool_id: 'pool1' }), { status: 200 });
  });

  await assignWorkerToPool('tok', 'w1', 'pool1');

  assert.equal(seenUrl, 'https://backend.test/worker-pools/workers/w1');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { worker_pool_id: 'pool1' });
});

test('assignWorkerToPool passes null through to clear a pool assignment', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'w1', worker_pool_id: null }), { status: 200 });
  });

  await assignWorkerToPool('tok', 'w1', null);

  assert.deepEqual(seenBody, { worker_pool_id: null });
});
