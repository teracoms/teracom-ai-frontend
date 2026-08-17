import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchMemorySummaries, generateMemorySummary } = await import('../memorySummaries.js');

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

test('fetchMemorySummaries GETs /memory-summaries/ with scope and scope_id as query params', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchMemorySummaries('tok', 'department', 'd1');

  assert.equal(seenUrl, 'https://backend.test/memory-summaries/?scope=department&scope_id=d1');
});

test('generateMemorySummary POSTs {scope, scope_id} to /memory-summaries/generate', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 's1' }), { status: 200 });
  });

  await generateMemorySummary('tok', 'worker', 'w1');

  assert.equal(seenUrl, 'https://backend.test/memory-summaries/generate');
  assert.deepEqual(seenBody, { scope: 'worker', scope_id: 'w1' });
});
