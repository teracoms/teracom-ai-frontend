import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  submitContent,
  draftContent,
  submitDraftedContent,
  decideContent,
  fetchContent,
  submitVideo,
  draftScript,
  submitDraftedVideo,
  decideVideo,
  fetchVideo,
} = await import('../marketingProduction.js');

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

test('submitContent POSTs the payload to /content/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1' }), { status: 200 });
  });

  await submitContent('tok', { campaign_id: 'c1', title: 'T', content: 'C' });

  assert.equal(seenUrl, 'https://backend.test/content/');
  assert.deepEqual(seenBody, { campaign_id: 'c1', title: 'T', content: 'C' });
});

test('draftContent POSTs the payload to /content/draft with worker_id as a query param', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1', status: 'draft' }), { status: 200 });
  });

  await draftContent('tok', 'w1', { campaign_id: 'c1', title: 'T', brief: 'B' });

  assert.equal(seenUrl, 'https://backend.test/content/draft?worker_id=w1');
  assert.deepEqual(seenBody, { campaign_id: 'c1', title: 'T', brief: 'B' });
});

test('submitDraftedContent POSTs to /content/{id}/submit', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 'p1', status: 'submitted' }), { status: 200 });
  });

  await submitDraftedContent('tok', 'p1');

  assert.equal(seenUrl, 'https://backend.test/content/p1/submit');
  assert.equal(seenMethod, 'POST');
});

test('decideContent POSTs {decision, notes} to /content/{id}/decide, omitting notes when not given', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1', status: 'approved' }), { status: 200 });
  });

  await decideContent('tok', 'p1', 'approved');

  assert.deepEqual(seenBody, { decision: 'approved' });
});

test('fetchContent GETs /content/ with campaign_id as a query param', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchContent('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/content/?campaign_id=c1');
});

test('submitVideo POSTs the payload to /videos/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'v1' }), { status: 200 });
  });

  await submitVideo('tok', { campaign_id: 'c1', title: 'T', script: 'S' });

  assert.equal(seenUrl, 'https://backend.test/videos/');
});

test('draftScript POSTs the payload to /videos/draft-script with worker_id as a query param', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'v1', status: 'draft' }), { status: 200 });
  });

  await draftScript('tok', 'w1', { campaign_id: 'c1', title: 'T', content_piece_id: 'p1' });

  assert.equal(seenUrl, 'https://backend.test/videos/draft-script?worker_id=w1');
  assert.deepEqual(seenBody, { campaign_id: 'c1', title: 'T', content_piece_id: 'p1' });
});

test('submitDraftedVideo POSTs to /videos/{id}/submit', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'v1', status: 'submitted' }), { status: 200 });
  });

  await submitDraftedVideo('tok', 'v1');

  assert.equal(seenUrl, 'https://backend.test/videos/v1/submit');
});

test('decideVideo POSTs {decision} to /videos/{id}/decide', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'v1' }), { status: 200 });
  });

  await decideVideo('tok', 'v1', 'rejected');

  assert.equal(seenUrl, 'https://backend.test/videos/v1/decide');
});

test('fetchVideo GETs /videos/ with campaign_id as a query param', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchVideo('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/videos/?campaign_id=c1');
});
