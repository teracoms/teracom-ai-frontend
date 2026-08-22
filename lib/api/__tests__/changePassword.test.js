import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { changePassword } = await import('../changePassword.js');

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

test('changePassword POSTs current_password/new_password to /auth/change-password', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ changed: true }), { status: 200 });
  });

  await changePassword('tok', 'old-pw', 'new-pw');

  assert.equal(seenUrl, 'https://backend.test/auth/change-password');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, { current_password: 'old-pw', new_password: 'new-pw' });
});
