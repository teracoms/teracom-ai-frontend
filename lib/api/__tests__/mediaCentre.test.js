import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { publishMediaItem, markMediaItemPublished, fetchMediaCentreItems } = await import('../mediaCentre.js');

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

test('publishMediaItem POSTs the payload to /media-centre/publish', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'm1' }), { status: 200 });
  });

  await publishMediaItem('tok', { kind: 'video', title: 'T', video_asset_id: 'v1' });

  assert.equal(seenUrl, 'https://backend.test/media-centre/publish');
  assert.deepEqual(seenBody, { kind: 'video', title: 'T', video_asset_id: 'v1' });
});

test('markMediaItemPublished POSTs to /media-centre/{id}/mark-published', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 'm1', publication_status: 'published' }), { status: 200 });
  });

  await markMediaItemPublished('tok', 'm1');

  assert.equal(seenUrl, 'https://backend.test/media-centre/m1/mark-published');
  assert.equal(seenMethod, 'POST');
});

test('fetchMediaCentreItems GETs /media-centre/, including a kind query param when given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchMediaCentreItems('tok', 'video');

  assert.equal(seenUrl, 'https://backend.test/media-centre/?kind=video');
});

test('fetchMediaCentreItems omits the kind query param when not given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchMediaCentreItems('tok');

  assert.equal(seenUrl, 'https://backend.test/media-centre/');
});
