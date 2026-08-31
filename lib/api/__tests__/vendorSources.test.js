import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchVendorSources, createVendorSource, scanVendorSource } = await import(
  '../vendorSources.js'
);
const { parseVendorSourcePayload } = await import('../validation.js');

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

test('fetchVendorSources calls GET /vendor-sources/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchVendorSources('token-123');
  assert.equal(seenUrl, 'https://backend.test/vendor-sources/');
});

test('createVendorSource POSTs a JSON body to /vendor-sources/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'vs-1' }), { status: 200 });
  });

  await createVendorSource('token-123', {
    vendor_name: 'Aritech',
    resource_url: 'https://aritech.com.au/resources/',
    worker_id: 'worker-1',
  });

  assert.equal(seenUrl, 'https://backend.test/vendor-sources/');
  assert.deepEqual(seenBody, {
    vendor_name: 'Aritech',
    resource_url: 'https://aritech.com.au/resources/',
    worker_id: 'worker-1',
  });
});

test('scanVendorSource POSTs to /vendor-sources/{id}/scan', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ discovered: 8, ingested: 7, skipped: 0, failed: 1, errors: [] }), {
      status: 200,
    });
  });

  await scanVendorSource('token-123', 'vs-1');
  assert.equal(seenUrl, 'https://backend.test/vendor-sources/vs-1/scan');
});

test('parseVendorSourcePayload accepts a valid payload', () => {
  const result = parseVendorSourcePayload({
    vendor_name: 'Aritech',
    resource_url: 'https://aritech.com.au/resources/',
    worker_id: 'worker-1',
  });

  assert.equal(result.valid, true);
  assert.equal(result.vendor_name, 'Aritech');
});

test('parseVendorSourcePayload rejects a non-https resource_url', () => {
  const result = parseVendorSourcePayload({
    vendor_name: 'Aritech',
    resource_url: 'http://aritech.com.au/resources/',
    worker_id: 'worker-1',
  });

  assert.equal(result.valid, false);
});

test('parseVendorSourcePayload rejects a missing worker_id', () => {
  const result = parseVendorSourcePayload({
    vendor_name: 'Aritech',
    resource_url: 'https://aritech.com.au/resources/',
  });

  assert.equal(result.valid, false);
});
