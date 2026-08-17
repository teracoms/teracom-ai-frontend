import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { createTask, updateTaskStatus, fetchTasks } = await import('../tasks.js');

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

test('createTask POSTs the payload to /tasks/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 't1' }), { status: 200 });
  });

  await createTask('tok', { project_id: 'p1', title: 'Book movers' });

  assert.equal(seenUrl, 'https://backend.test/tasks/');
  assert.deepEqual(seenBody, { project_id: 'p1', title: 'Book movers' });
});

test('updateTaskStatus PATCHes {status} to /tasks/{id}/status', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 't1', status: 'done' }), { status: 200 });
  });

  await updateTaskStatus('tok', 't1', 'done');

  assert.equal(seenUrl, 'https://backend.test/tasks/t1/status');
  assert.deepEqual(seenBody, { status: 'done' });
});

test('fetchTasks GETs /tasks/, including project_id as a query param when given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchTasks('tok', 'p1');

  assert.equal(seenUrl, 'https://backend.test/tasks/?project_id=p1');
});

test('fetchTasks omits project_id when not given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchTasks('tok');

  assert.equal(seenUrl, 'https://backend.test/tasks/');
});
