import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchOrganisationOnboardingTasks, completeOrganisationOnboardingTask } = await import(
  '../organisationOnboarding.js'
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

test('fetchOrganisationOnboardingTasks GETs /organisation-onboarding-tasks/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchOrganisationOnboardingTasks('tok');

  assert.equal(seenUrl, 'https://backend.test/organisation-onboarding-tasks/');
});

test('completeOrganisationOnboardingTask PATCHes /organisation-onboarding-tasks/{id}/complete', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 't1', status: 'done' }), { status: 200 });
  });

  await completeOrganisationOnboardingTask('tok', 't1');

  assert.equal(seenUrl, 'https://backend.test/organisation-onboarding-tasks/t1/complete');
  assert.equal(seenMethod, 'PATCH');
});
