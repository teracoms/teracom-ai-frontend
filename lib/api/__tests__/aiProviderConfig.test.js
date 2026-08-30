import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchAIProviderConfig, setAIProviderConfig, fetchProviderHealth } = await import('../aiProviderConfig.js');

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

test('fetchAIProviderConfig GETs /ai-provider-config/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ provider: 'ollama' }), { status: 200 });
  });

  await fetchAIProviderConfig('tok');

  assert.equal(seenUrl, 'https://backend.test/ai-provider-config/');
});

test('setAIProviderConfig PUTs the payload to /ai-provider-config/', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ provider: 'gemini', model_name: 'gemini-pro' }), { status: 200 });
  });

  await setAIProviderConfig('tok', { provider: 'gemini', model_name: 'gemini-pro' });

  assert.equal(seenUrl, 'https://backend.test/ai-provider-config/');
  assert.equal(seenMethod, 'PUT');
  assert.deepEqual(seenBody, { provider: 'gemini', model_name: 'gemini-pro' });
});

test('fetchProviderHealth GETs /ai-provider-config/health', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([{ provider: 'ollama', reachable: true }]), { status: 200 });
  });

  const data = await fetchProviderHealth('tok');

  assert.equal(seenUrl, 'https://backend.test/ai-provider-config/health');
  assert.equal(data[0].provider, 'ollama');
});
