import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchWorkerList,
  fetchWorkerSummary,
  fetchWorkerActivity,
  fetchWorkerKnowledge,
  fetchWorkerMemories,
  fetchKnowledgeCatalogue,
  createWorker,
  assignWorkerKnowledge,
  removeWorkerKnowledge,
} = await import('../workers.js');

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

test('fetchWorkerList calls GET /worker-list/ with the bearer token', async () => {
  let seenUrl;
  let seenMethod;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenHeaders = init.headers;
    return new Response(JSON.stringify([{ id: 'w1', name: 'Estimator' }]), { status: 200 });
  });

  const data = await fetchWorkerList('tok');

  assert.equal(seenUrl, 'https://backend.test/worker-list/');
  assert.equal(seenMethod, 'GET');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.deepEqual(data, [{ id: 'w1', name: 'Estimator' }]);
});

test('fetchWorkerSummary calls GET /worker-summary/{workerId}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ worker: { id: 'w1' }, knowledge_count: 2, memory_count: 1 }), {
      status: 200,
    });
  });

  const data = await fetchWorkerSummary('tok', 'w1');

  assert.equal(seenUrl, 'https://backend.test/worker-summary/w1');
  assert.deepEqual(data, { worker: { id: 'w1' }, knowledge_count: 2, memory_count: 1 });
});

test('fetchWorkerActivity calls GET /worker-activity/{workerId}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ chat_sessions: 3, memories: 1, knowledge_assignments: 2 }), {
      status: 200,
    });
  });

  await fetchWorkerActivity('tok', 'w1');
  assert.equal(seenUrl, 'https://backend.test/worker-activity/w1');
});

test('fetchWorkerKnowledge calls GET /worker-knowledge/{workerId}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchWorkerKnowledge('tok', 'w1');
  assert.equal(seenUrl, 'https://backend.test/worker-knowledge/w1');
});

test('fetchWorkerMemories calls GET /memory/{workerId}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchWorkerMemories('tok', 'w1');
  assert.equal(seenUrl, 'https://backend.test/memory/w1');
});

test('fetchKnowledgeCatalogue calls GET /knowledge/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchKnowledgeCatalogue('tok');
  assert.equal(seenUrl, 'https://backend.test/knowledge/');
});

test('createWorker POSTs a JSON body to /workers/', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'w2', name: 'Estimator' }), { status: 200 });
  });

  const payload = {
    organisation_id: 'org-1',
    name: 'Estimator',
    role: 'Estimation Assistant',
    purpose: 'Helps with quotes',
    instructions: 'Be concise',
    status: 'active',
  };

  const data = await createWorker('tok', payload);

  assert.equal(seenUrl, 'https://backend.test/workers/');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, payload);
  assert.deepEqual(data, { id: 'w2', name: 'Estimator' });
});

test('assignWorkerKnowledge POSTs worker_id/knowledge_id as query params, not a JSON body', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = init.body;
    return new Response(JSON.stringify({ id: 'perm-1' }), { status: 200 });
  });

  await assignWorkerKnowledge('tok', 'w1', 'k1');

  assert.equal(seenUrl, 'https://backend.test/worker-knowledge/assign?worker_id=w1&knowledge_id=k1');
  assert.equal(seenMethod, 'POST');
  assert.equal(seenBody, undefined);
});

test('removeWorkerKnowledge DELETEs with worker_id/knowledge_id as query params', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ removed: true }), { status: 200 });
  });

  const data = await removeWorkerKnowledge('tok', 'w1', 'k1');

  assert.equal(seenUrl, 'https://backend.test/worker-knowledge/remove?worker_id=w1&knowledge_id=k1');
  assert.equal(seenMethod, 'DELETE');
  assert.deepEqual(data, { removed: true });
});
