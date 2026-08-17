import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  suggestFederationEscalation,
  consultFederation,
  fetchFederationConsultations,
} = await import('../federationConsultation.js');

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

test('suggestFederationEscalation POSTs {worker_id, message} to /federation/suggest', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ available: true, suggested: false }), { status: 200 });
  });

  await suggestFederationEscalation('tok', 'w1', 'What is the best approach here?');

  assert.equal(seenUrl, 'https://backend.test/federation/suggest');
  assert.deepEqual(seenBody, { worker_id: 'w1', message: 'What is the best approach here?' });
});

test('consultFederation POSTs the payload to /federation/consult', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ consultation_id: 'c1', is_simulated: true }), { status: 200 });
  });

  await consultFederation('tok', { worker_id: 'w1', message: 'Help', federation_provider_id: 'p1' });

  assert.equal(seenUrl, 'https://backend.test/federation/consult');
  assert.deepEqual(seenBody, { worker_id: 'w1', message: 'Help', federation_provider_id: 'p1' });
});

test('fetchFederationConsultations GETs /federation/consultations', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchFederationConsultations('tok');

  assert.equal(seenUrl, 'https://backend.test/federation/consultations');
});
