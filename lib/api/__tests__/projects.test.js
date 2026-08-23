import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { createProject, updateProjectStatus, fetchProjects, planProject } = await import('../projects.js');

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

test('createProject POSTs the payload to /projects/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1' }), { status: 200 });
  });

  await createProject('tok', { name: 'Office Relocation', department_id: 'd1' });

  assert.equal(seenUrl, 'https://backend.test/projects/');
  assert.deepEqual(seenBody, { name: 'Office Relocation', department_id: 'd1' });
});

test('updateProjectStatus PATCHes {status} to /projects/{id}/status', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1', status: 'completed' }), { status: 200 });
  });

  await updateProjectStatus('tok', 'p1', 'completed');

  assert.equal(seenUrl, 'https://backend.test/projects/p1/status');
  assert.deepEqual(seenBody, { status: 'completed' });
});

test('fetchProjects GETs /projects/, including department_id as a query param when given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchProjects('tok', 'd1');

  assert.equal(seenUrl, 'https://backend.test/projects/?department_id=d1');
});

test('fetchProjects omits department_id when not given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchProjects('tok');

  assert.equal(seenUrl, 'https://backend.test/projects/');
});

test('planProject POSTs the payload to /projects/plan', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ available: true, project: { id: 'p1' }, tasks: [] }), { status: 200 });
  });

  await planProject('tok', { primary_worker_id: 'w1', objective: 'Do the thing.', name: 'New Project' });

  assert.equal(seenUrl, 'https://backend.test/projects/plan');
  assert.deepEqual(seenBody, { primary_worker_id: 'w1', objective: 'Do the thing.', name: 'New Project' });
});
