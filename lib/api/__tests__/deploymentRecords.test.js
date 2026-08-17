import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  submitDeploymentRecord,
  decideDeploymentRecord,
  completeDeploymentRecord,
  fetchDeploymentRecords,
} = await import('../deploymentRecords.js');

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

test('submitDeploymentRecord POSTs the payload to /deployment-records/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'd1' }), { status: 200 });
  });

  await submitDeploymentRecord('tok', { version_label: 'v1.0.0', description: 'Release.' });

  assert.equal(seenUrl, 'https://backend.test/deployment-records/');
  assert.deepEqual(seenBody, { version_label: 'v1.0.0', description: 'Release.' });
});

test('decideDeploymentRecord POSTs {decision, notes} to /deployment-records/{id}/decide, omitting notes when not given', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'd1', status: 'approved' }), { status: 200 });
  });

  await decideDeploymentRecord('tok', 'd1', 'approved');

  assert.equal(seenUrl, 'https://backend.test/deployment-records/d1/decide');
  assert.deepEqual(seenBody, { decision: 'approved' });
});

test('completeDeploymentRecord POSTs to /deployment-records/{id}/complete with no body', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 'd1', status: 'completed' }), { status: 200 });
  });

  await completeDeploymentRecord('tok', 'd1');

  assert.equal(seenUrl, 'https://backend.test/deployment-records/d1/complete');
  assert.equal(seenMethod, 'POST');
});

test('fetchDeploymentRecords GETs /deployment-records/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchDeploymentRecords('tok');

  assert.equal(seenUrl, 'https://backend.test/deployment-records/');
});
