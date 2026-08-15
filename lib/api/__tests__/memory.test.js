import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchMemorySummary, storeMemory } = await import('../memory.js');

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

test('fetchMemorySummary calls GET /memory-summary/', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(JSON.stringify({ total_memories: 3 }), { status: 200 });
  });

  const data = await fetchMemorySummary('tok');

  assert.equal(seenUrl, 'https://backend.test/memory-summary/');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.deepEqual(data, { total_memories: 3 });
});

test('storeMemory POSTs {worker_id, memory} to /memory/store', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        id: 'm1',
        worker_id: 'w1',
        memory_type: 'fact',
        memory_content: 'Preferred vendor is Acme Corp',
      }),
      { status: 200 }
    );
  });

  const data = await storeMemory('tok', 'w1', 'Preferred vendor is Acme Corp');

  assert.equal(seenUrl, 'https://backend.test/memory/store');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, { worker_id: 'w1', memory: 'Preferred vendor is Acme Corp' });
  assert.deepEqual(data, {
    id: 'm1',
    worker_id: 'w1',
    memory_type: 'fact',
    memory_content: 'Preferred vendor is Acme Corp',
  });
});
