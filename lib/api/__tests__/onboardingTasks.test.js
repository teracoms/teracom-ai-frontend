import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { seedOnboardingTasks, fetchOnboardingTasks, completeOnboardingTask } = await import('../onboardingTasks.js');

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

test('seedOnboardingTasks POSTs {crm_contact_id} to /onboarding-tasks/seed', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await seedOnboardingTasks('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/onboarding-tasks/seed');
  assert.deepEqual(seenBody, { crm_contact_id: 'c1' });
});

test('fetchOnboardingTasks GETs /onboarding-tasks/ with crm_contact_id as a query param', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchOnboardingTasks('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/onboarding-tasks/?crm_contact_id=c1');
});

test('completeOnboardingTask PATCHes /onboarding-tasks/{id}/complete', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 't1', status: 'done' }), { status: 200 });
  });

  await completeOnboardingTask('tok', 't1');

  assert.equal(seenUrl, 'https://backend.test/onboarding-tasks/t1/complete');
  assert.equal(seenMethod, 'PATCH');
});
