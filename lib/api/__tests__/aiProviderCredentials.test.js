import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchAIProviderCredentials,
  setAIProviderCredential,
  testAIProviderCredential,
  deleteAIProviderCredential,
  setAIProviderCredentialEnabled,
} = await import('../aiProviderCredentials.js');

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

test('fetchAIProviderCredentials GETs /ai-provider-credentials/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([{ provider: 'openai', is_configured: false }]), { status: 200 });
  });

  await fetchAIProviderCredentials('tok');

  assert.equal(seenUrl, 'https://backend.test/ai-provider-credentials/');
});

test('setAIProviderCredential PUTs {api_key} to /ai-provider-credentials/{provider}', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ provider: 'anthropic', is_configured: true }), { status: 200 });
  });

  await setAIProviderCredential('tok', 'anthropic', 'sk-real-key');

  assert.equal(seenUrl, 'https://backend.test/ai-provider-credentials/anthropic');
  assert.equal(seenMethod, 'PUT');
  assert.deepEqual(seenBody, { api_key: 'sk-real-key' });
});

test('testAIProviderCredential POSTs to /ai-provider-credentials/{provider}/test', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ provider: 'anthropic', is_active: true }), { status: 200 });
  });

  await testAIProviderCredential('tok', 'anthropic');

  assert.equal(seenUrl, 'https://backend.test/ai-provider-credentials/anthropic/test');
  assert.equal(seenMethod, 'POST');
});

test('setAIProviderCredentialEnabled PATCHes {enabled} to /ai-provider-credentials/{provider}/enabled', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ provider: 'anthropic', is_enabled: false }), { status: 200 });
  });

  await setAIProviderCredentialEnabled('tok', 'anthropic', false);

  assert.equal(seenUrl, 'https://backend.test/ai-provider-credentials/anthropic/enabled');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { enabled: false });
});

test('deleteAIProviderCredential DELETEs /ai-provider-credentials/{provider}', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(null, { status: 204 });
  });

  await deleteAIProviderCredential('tok', 'anthropic');

  assert.equal(seenUrl, 'https://backend.test/ai-provider-credentials/anthropic');
  assert.equal(seenMethod, 'DELETE');
});
