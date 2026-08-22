import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { setupMfa, confirmMfa, disableMfa, verifyMfaLogin } = await import('../mfa.js');

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

test('setupMfa POSTs to /auth/mfa/setup with the bearer token', async () => {
  let seenUrl;
  let seenAuth;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenAuth = init.headers.Authorization;
    return new Response(JSON.stringify({ secret: 's' }), { status: 200 });
  });

  await setupMfa('tok');

  assert.equal(seenUrl, 'https://backend.test/auth/mfa/setup');
  assert.equal(seenAuth, 'Bearer tok');
});

test('confirmMfa POSTs {code} to /auth/mfa/confirm', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ enabled: true, backup_codes: [] }), { status: 200 });
  });

  await confirmMfa('tok', '123456');

  assert.deepEqual(seenBody, { code: '123456' });
});

test('disableMfa POSTs {password, code} to /auth/mfa/disable', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ enabled: false }), { status: 200 });
  });

  await disableMfa('tok', 'pw', '123456');

  assert.deepEqual(seenBody, { password: 'pw', code: '123456' });
});

test('verifyMfaLogin POSTs {challenge_token, code} to /auth/mfa/login-verify with no token', async () => {
  let seenUrl;
  let seenAuth;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenAuth = init.headers.Authorization;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r' }), { status: 200 });
  });

  await verifyMfaLogin('challenge-tok', '123456');

  assert.equal(seenUrl, 'https://backend.test/auth/mfa/login-verify');
  assert.equal(seenAuth, undefined);
  assert.deepEqual(seenBody, { challenge_token: 'challenge-tok', code: '123456' });
});

test('verifyMfaLogin forwards the real browser User-Agent when given one', async () => {
  let seenUserAgent;
  mockFetch(async (url, init) => {
    seenUserAgent = init.headers['User-Agent'];
    return new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r' }), { status: 200 });
  });

  await verifyMfaLogin('challenge-tok', '123456', 'Mozilla/5.0 Example');

  assert.equal(seenUserAgent, 'Mozilla/5.0 Example');
});
