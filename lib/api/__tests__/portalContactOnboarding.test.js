import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchPortalContactOnboardingTasks } = await import('../portalContactOnboarding.js');

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

test('fetchPortalContactOnboardingTasks GETs /portal-contact/onboarding-tasks', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPortalContactOnboardingTasks('tok');

  assert.equal(seenUrl, 'https://backend.test/portal-contact/onboarding-tasks');
});
