import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchVendorSources,
  createVendorSource,
  scanVendorSource,
  updateVendorSource,
  fetchVendorSourceDocuments,
} = await import('../vendorSources.js');
const { parseVendorSourcePayload, parseVendorSourceUpdatePayload } = await import('../validation.js');

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

test('parseVendorSourcePayload defaults schedule_interval to manual', () => {
  const result = parseVendorSourcePayload({
    vendor_name: 'Aritech',
    resource_url: 'https://aritech.com.au/resources/',
    worker_id: 'worker-1',
  });

  assert.equal(result.schedule_interval, 'manual');
});

test('updateVendorSource PATCHes only the fields given to /vendor-sources/{id}', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'vs-1', enabled: false }), { status: 200 });
  });

  await updateVendorSource('token-123', 'vs-1', { enabled: false });

  assert.equal(seenUrl, 'https://backend.test/vendor-sources/vs-1');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { enabled: false });
});

test('fetchVendorSourceDocuments calls GET /vendor-sources/{id}/documents', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchVendorSourceDocuments('token-123', 'vs-1');
  assert.equal(seenUrl, 'https://backend.test/vendor-sources/vs-1/documents');
});

test('parseVendorSourceUpdatePayload only forwards fields explicitly present', () => {
  const result = parseVendorSourceUpdatePayload({ enabled: false });

  assert.deepEqual(result, { valid: true, enabled: false });
});

test('parseVendorSourceUpdatePayload rejects an invalid schedule_interval', () => {
  const result = parseVendorSourceUpdatePayload({ schedule_interval: 'hourly' });

  assert.equal(result.valid, false);
});

test('parseVendorSourceUpdatePayload rejects a non-https resource_url', () => {
  const result = parseVendorSourceUpdatePayload({ resource_url: 'http://example.com' });

  assert.equal(result.valid, false);
});

test('parseVendorSourceUpdatePayload accepts a removed:true soft-delete request', () => {
  const result = parseVendorSourceUpdatePayload({ removed: true });

  assert.deepEqual(result, { valid: true, removed: true });
});

test('parseVendorSourceUpdatePayload rejects an entirely empty update', () => {
  const result = parseVendorSourceUpdatePayload({});

  assert.equal(result.valid, false);
});
