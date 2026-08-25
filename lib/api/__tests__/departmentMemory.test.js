import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchDepartmentMemories, storeDepartmentMemory, archiveDepartmentMemory } = await import('../departmentMemory.js');

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

test('fetchDepartmentMemories GETs /department-memory/{id}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchDepartmentMemories('tok', 'd1');

  assert.equal(seenUrl, 'https://backend.test/department-memory/d1');
});

test('storeDepartmentMemory POSTs {department_id, memory} to /department-memory/store', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'm1' }), { status: 200 });
  });

  await storeDepartmentMemory('tok', 'd1', 'We prefer Cisco switches.');

  assert.equal(seenUrl, 'https://backend.test/department-memory/store');
  assert.deepEqual(seenBody, { department_id: 'd1', memory: 'We prefer Cisco switches.' });
});

test('archiveDepartmentMemory PATCHes /department-memory/{id}/archive with department_id as a query param', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 'm1', is_archived: true }), { status: 200 });
  });

  const data = await archiveDepartmentMemory('tok', 'm1', 'd1');

  assert.equal(seenUrl, 'https://backend.test/department-memory/m1/archive?department_id=d1');
  assert.equal(seenMethod, 'PATCH');
  assert.equal(data.is_archived, true);
});
