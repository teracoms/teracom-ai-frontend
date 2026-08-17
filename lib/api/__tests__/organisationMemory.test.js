import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchOrganisationMemories, storeOrganisationMemory } = await import('../organisationMemory.js');

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

test('fetchOrganisationMemories GETs /organisation-memory/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchOrganisationMemories('tok');

  assert.equal(seenUrl, 'https://backend.test/organisation-memory/');
});

test('storeOrganisationMemory POSTs {memory} to /organisation-memory/store', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'm1' }), { status: 200 });
  });

  await storeOrganisationMemory('tok', 'Our head office is in Sydney.');

  assert.equal(seenUrl, 'https://backend.test/organisation-memory/store');
  assert.deepEqual(seenBody, { memory: 'Our head office is in Sydney.' });
});
