import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchWorkerPersonality,
  updateWorkerPersonality,
  uploadWorkerAvatarImage,
  clearWorkerAvatarImage,
} = await import('../workerPersonality.js');

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

test('fetchWorkerPersonality calls GET /workers/{id}/personality', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ worker_id: 'worker-1' }), { status: 200 });
  });

  await fetchWorkerPersonality('token-123', 'worker-1');
  assert.equal(seenUrl, 'https://backend.test/workers/worker-1/personality');
});

test('updateWorkerPersonality PATCHes only the fields given', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ worker_id: 'worker-1', formality: 'formal' }), { status: 200 });
  });

  await updateWorkerPersonality('token-123', 'worker-1', { formality: 'formal' });

  assert.equal(seenUrl, 'https://backend.test/workers/worker-1/personality');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { formality: 'formal' });
});

test('uploadWorkerAvatarImage POSTs a FormData body with no Content-Type override', async () => {
  let seenUrl;
  let seenMethod;
  let seenHasContentType;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenHasContentType = 'Content-Type' in init.headers;
    return new Response(JSON.stringify({ worker_id: 'worker-1', avatar_type: 'static' }), { status: 200 });
  });

  const formData = new FormData();
  formData.append('image', new Blob(['fake'], { type: 'image/png' }), 'avatar.png');

  await uploadWorkerAvatarImage('token-123', 'worker-1', formData);

  assert.equal(seenUrl, 'https://backend.test/workers/worker-1/personality/avatar-image');
  assert.equal(seenMethod, 'POST');
  // FormData bodies must never get a manual Content-Type header -- fetch
  // sets the multipart boundary itself (client.js's own real contract).
  assert.equal(seenHasContentType, false);
});

test('clearWorkerAvatarImage DELETEs /workers/{id}/personality/avatar-image', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ worker_id: 'worker-1', avatar_type: 'placeholder' }), { status: 200 });
  });

  await clearWorkerAvatarImage('token-123', 'worker-1');

  assert.equal(seenUrl, 'https://backend.test/workers/worker-1/personality/avatar-image');
  assert.equal(seenMethod, 'DELETE');
});
