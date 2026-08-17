import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  createContact,
  fetchContacts,
  fetchContact,
  updateContactStage,
  updateContactHealth,
  fetchPipelineSummary,
} = await import('../crm.js');

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

test('createContact POSTs the payload to /crm/contacts/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'c1' }), { status: 200 });
  });

  await createContact('tok', { name: 'Alex' });

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/');
  assert.deepEqual(seenBody, { name: 'Alex' });
});

test('fetchContacts GETs /crm/contacts/, including a stage query param when given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchContacts('tok', 'lead');

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/?stage=lead');
});

test('fetchContacts omits the stage query param when not given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchContacts('tok');

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/');
});

test('fetchContact GETs /crm/contacts/{id}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'c1' }), { status: 200 });
  });

  await fetchContact('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/c1');
});

test('updateContactStage PATCHes {stage} to /crm/contacts/{id}/stage', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'c1', stage: 'lead' }), { status: 200 });
  });

  await updateContactStage('tok', 'c1', 'lead');

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/c1/stage');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { stage: 'lead' });
});

test('updateContactHealth PATCHes {health_status} to /crm/contacts/{id}/health', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'c1', health_status: 'healthy' }), { status: 200 });
  });

  await updateContactHealth('tok', 'c1', 'healthy');

  assert.equal(seenUrl, 'https://backend.test/crm/contacts/c1/health');
  assert.deepEqual(seenBody, { health_status: 'healthy' });
});

test('fetchPipelineSummary GETs /crm/pipeline-summary', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ stage_counts: {} }), { status: 200 });
  });

  await fetchPipelineSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/crm/pipeline-summary');
});
