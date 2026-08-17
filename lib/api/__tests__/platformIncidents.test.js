import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  createPlatformIncident,
  updatePlatformIncidentStatus,
  fetchPlatformIncidents,
} = await import('../platformIncidents.js');

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

test('createPlatformIncident POSTs the payload to /platform-incidents/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'i1' }), { status: 200 });
  });

  await createPlatformIncident('tok', { title: 'Outage', description: 'Down.', severity: 'high' });

  assert.equal(seenUrl, 'https://backend.test/platform-incidents/');
  assert.deepEqual(seenBody, { title: 'Outage', description: 'Down.', severity: 'high' });
});

test('updatePlatformIncidentStatus PATCHes {status} to /platform-incidents/{id}/status', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'i1', status: 'resolved' }), { status: 200 });
  });

  await updatePlatformIncidentStatus('tok', 'i1', 'resolved');

  assert.equal(seenUrl, 'https://backend.test/platform-incidents/i1/status');
  assert.deepEqual(seenBody, { status: 'resolved' });
});

test('fetchPlatformIncidents GETs /platform-incidents/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchPlatformIncidents('tok');

  assert.equal(seenUrl, 'https://backend.test/platform-incidents/');
});
