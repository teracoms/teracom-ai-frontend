import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchDepartments, fetchDepartment, createDepartment, assignWorkerDepartment } = await import(
  '../departments.js'
);

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

test('fetchDepartments GETs /departments/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchDepartments('tok');

  assert.equal(seenUrl, 'https://backend.test/departments/');
});

test('fetchDepartment GETs /departments/{id}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'd1' }), { status: 200 });
  });

  await fetchDepartment('tok', 'd1');

  assert.equal(seenUrl, 'https://backend.test/departments/d1');
});

test('createDepartment POSTs {name} to /departments/, omitting description when not given', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'd1' }), { status: 200 });
  });

  await createDepartment('tok', 'Engineering');

  assert.deepEqual(seenBody, { name: 'Engineering' });
});

test('createDepartment includes description when given', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'd1' }), { status: 200 });
  });

  await createDepartment('tok', 'Engineering', 'Infra & network.');

  assert.deepEqual(seenBody, { name: 'Engineering', description: 'Infra & network.' });
});

test('assignWorkerDepartment PATCHes {department_id} to /workers/{id}/department, including an explicit null', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'w1', department_id: null }), { status: 200 });
  });

  await assignWorkerDepartment('tok', 'w1', null);

  assert.equal(seenUrl, 'https://backend.test/workers/w1/department');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { department_id: null });
});
