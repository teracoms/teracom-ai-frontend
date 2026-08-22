import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchLoginHistory, fetchSecurityAuditLog } = await import('../securityEvents.js');

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

test('fetchLoginHistory GETs /security/login-history', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchLoginHistory('tok');

  assert.equal(seenUrl, 'https://backend.test/security/login-history');
});

test('fetchSecurityAuditLog GETs /security/audit-log', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchSecurityAuditLog('tok');

  assert.equal(seenUrl, 'https://backend.test/security/audit-log');
});
