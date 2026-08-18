import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { submitLead } = await import('../leads.js');

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

test('submitLead POSTs the payload to /leads/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'lead-1', status: 'new' }), { status: 201 });
  });

  await submitLead({ name: 'Jordan', email: 'jordan@example.com', inquiry_type: 'contact_sales' });

  assert.equal(seenUrl, 'https://backend.test/leads/');
  assert.deepEqual(seenBody, { name: 'Jordan', email: 'jordan@example.com', inquiry_type: 'contact_sales' });
});
