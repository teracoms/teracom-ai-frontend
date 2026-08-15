import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchPortalDashboard,
  fetchRecentActivity,
  fetchChatAnalytics,
  fetchOrganisationSummary,
} = await import('../dashboard.js');
const { ApiError } = await import('../client.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

function mockJsonResponse(body, init = {}) {
  global.fetch = async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
}

test('fetchPortalDashboard calls GET /portal-dashboard/ with the bearer token', async () => {
  let seenUrl;
  let seenHeaders;
  global.fetch = async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(
      JSON.stringify({ workers: 2, knowledge: 5, memories: 1, chat_sessions: 4 }),
      { status: 200 }
    );
  };

  const data = await fetchPortalDashboard('tok-123');

  assert.equal(seenUrl, 'https://backend.test/portal-dashboard/');
  assert.equal(seenHeaders.Authorization, 'Bearer tok-123');
  assert.deepEqual(data, { workers: 2, knowledge: 5, memories: 1, chat_sessions: 4 });
});

test('fetchRecentActivity calls GET /activity/', async () => {
  let seenUrl;
  global.fetch = async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ knowledge: [], chat_sessions: [], memories: [] }), {
      status: 200,
    });
  };

  const data = await fetchRecentActivity('tok-123');

  assert.equal(seenUrl, 'https://backend.test/activity/');
  assert.deepEqual(data, { knowledge: [], chat_sessions: [], memories: [] });
});

test('fetchChatAnalytics calls GET /analytics/chat', async () => {
  let seenUrl;
  global.fetch = async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ sessions: 7, messages: 21 }), { status: 200 });
  };

  const data = await fetchChatAnalytics('tok-123');

  assert.equal(seenUrl, 'https://backend.test/analytics/chat');
  assert.deepEqual(data, { sessions: 7, messages: 21 });
});

test('fetchOrganisationSummary returns the first organisation when the backend returns one', async () => {
  mockJsonResponse([{ id: 'org-1', name: 'Teracom AI', slug: 'teracom-ai' }]);

  const org = await fetchOrganisationSummary('tok-123');

  assert.deepEqual(org, { id: 'org-1', name: 'Teracom AI', slug: 'teracom-ai' });
});

test('fetchOrganisationSummary returns null when the backend returns an empty list', async () => {
  mockJsonResponse([]);

  const org = await fetchOrganisationSummary('tok-123');

  assert.equal(org, null);
});

test('fetchOrganisationSummary returns null when the backend response is not an array', async () => {
  mockJsonResponse(null);

  const org = await fetchOrganisationSummary('tok-123');

  assert.equal(org, null);
});

test('fetchOrganisationSummary propagates a 403 as ApiError instead of swallowing it', async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ detail: 'Insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });

  await assert.rejects(
    () => fetchOrganisationSummary('tok-123'),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 403);
      return true;
    }
  );
});
