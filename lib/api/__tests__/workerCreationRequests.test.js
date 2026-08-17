import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  submitWorkerCreationRequest,
  decideWorkerCreationRequest,
  fetchWorkerCreationRequests,
} = await import('../workerCreationRequests.js');

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

test('submitWorkerCreationRequest POSTs the payload to /worker-creation-requests/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'r1' }), { status: 200 });
  });

  await submitWorkerCreationRequest('tok', {
    name: 'Analyst',
    role: 'Analyst',
    purpose: 'Analyses things.',
    instructions: 'Be precise.',
  });

  assert.equal(seenUrl, 'https://backend.test/worker-creation-requests/');
  assert.deepEqual(seenBody, {
    name: 'Analyst',
    role: 'Analyst',
    purpose: 'Analyses things.',
    instructions: 'Be precise.',
  });
});

test('decideWorkerCreationRequest POSTs {decision, notes} to /worker-creation-requests/{id}/decide, omitting notes when not given', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'r1', status: 'approved' }), { status: 200 });
  });

  await decideWorkerCreationRequest('tok', 'r1', 'approved');

  assert.equal(seenUrl, 'https://backend.test/worker-creation-requests/r1/decide');
  assert.deepEqual(seenBody, { decision: 'approved' });
});

test('fetchWorkerCreationRequests GETs /worker-creation-requests/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchWorkerCreationRequests('tok');

  assert.equal(seenUrl, 'https://backend.test/worker-creation-requests/');
});
