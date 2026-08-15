import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchUsers, createUser, fetchPermissions, createPermission } = await import('../admin.js');

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

test('fetchUsers calls GET /users/ with the bearer token', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(
      JSON.stringify([{ id: 'u1', email: 'a@example.com', role: 'admin' }]),
      { status: 200 }
    );
  });

  const data = await fetchUsers('tok');

  assert.equal(seenUrl, 'https://backend.test/users/');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.deepEqual(data, [{ id: 'u1', email: 'a@example.com', role: 'admin' }]);
});

test('createUser POSTs a JSON body to /users/', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ id: 'u2', email: 'b@example.com', role: 'member' }),
      { status: 200 }
    );
  });

  const payload = {
    organisation_id: 'org-1',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'b@example.com',
    password_hash: 'hunter2',
    role: 'member',
  };

  const data = await createUser('tok', payload);

  assert.equal(seenUrl, 'https://backend.test/users/');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, payload);
  assert.deepEqual(data, { id: 'u2', email: 'b@example.com', role: 'member' });
});

test('fetchPermissions calls GET /permissions/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPermissions('tok');
  assert.equal(seenUrl, 'https://backend.test/permissions/');
});

test('createPermission POSTs {worker_id, knowledge_id} to /permissions/', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ id: 'p1', worker_id: 'w1', knowledge_id: 'k1' }),
      { status: 200 }
    );
  });

  const data = await createPermission('tok', 'w1', 'k1');

  assert.equal(seenUrl, 'https://backend.test/permissions/');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, { worker_id: 'w1', knowledge_id: 'k1' });
  assert.deepEqual(data, { id: 'p1', worker_id: 'w1', knowledge_id: 'k1' });
});
