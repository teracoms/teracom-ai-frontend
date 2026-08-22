import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchUserSettings, updateUserSettings } = await import('../userSettings.js');

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

test('fetchUserSettings GETs /users/me/settings', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ preferences: {} }), { status: 200 });
  });

  await fetchUserSettings('tok');

  assert.equal(seenUrl, 'https://backend.test/users/me/settings');
});

test('updateUserSettings PATCHes the payload to /users/me/settings', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ preferences: {} }), { status: 200 });
  });

  await updateUserSettings('tok', { first_name: 'New' });

  assert.equal(seenUrl, 'https://backend.test/users/me/settings');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { first_name: 'New' });
});
