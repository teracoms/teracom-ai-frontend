import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchSessions, revokeSession, revokeOtherSessions } = await import('../sessions.js');

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

test('fetchSessions GETs /auth/sessions with current_refresh_token as a query param', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchSessions('tok', 'raw-refresh-tok');

  assert.equal(seenUrl, 'https://backend.test/auth/sessions?current_refresh_token=raw-refresh-tok');
});

test('fetchSessions omits the query param when no current refresh token is given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchSessions('tok', null);

  assert.equal(seenUrl, 'https://backend.test/auth/sessions');
});

test('revokeSession POSTs to /auth/sessions/{id}/revoke', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ revoked: true }), { status: 200 });
  });

  await revokeSession('tok', 'session-1');

  assert.equal(seenUrl, 'https://backend.test/auth/sessions/session-1/revoke');
  assert.equal(seenMethod, 'POST');
});

test('revokeOtherSessions POSTs to /auth/sessions/revoke-others', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ revoked_count: 2 }), { status: 200 });
  });

  await revokeOtherSessions('tok', 'raw-refresh-tok');

  assert.equal(seenUrl, 'https://backend.test/auth/sessions/revoke-others?current_refresh_token=raw-refresh-tok');
  assert.equal(seenMethod, 'POST');
});
