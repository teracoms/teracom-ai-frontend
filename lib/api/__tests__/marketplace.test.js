import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchMarketplacePacks, fetchMarketplacePackDetail } = await import('../marketplace.js');

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

test('fetchMarketplacePacks calls GET /marketplace/packs with the bearer token', async () => {
  let seenUrl;
  let seenMethod;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenHeaders = init.headers;
    return new Response(JSON.stringify([{ id: 'p1', slug: 'critical-infrastructure' }]), {
      status: 200,
    });
  });

  const result = await fetchMarketplacePacks('token-123');

  assert.equal(seenUrl, 'https://backend.test/marketplace/packs');
  assert.equal(seenMethod, 'GET');
  assert.equal(seenHeaders.Authorization, 'Bearer token-123');
  assert.deepEqual(result, [{ id: 'p1', slug: 'critical-infrastructure' }]);
});

test('fetchMarketplacePackDetail calls GET /marketplace/packs/{slug}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ slug: 'critical-infrastructure', persona_templates: [] }), {
      status: 200,
    });
  });

  const result = await fetchMarketplacePackDetail('token-123', 'critical-infrastructure');

  assert.equal(seenUrl, 'https://backend.test/marketplace/packs/critical-infrastructure');
  assert.equal(result.slug, 'critical-infrastructure');
});

test('fetchMarketplacePackDetail URL-encodes the slug', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({}), { status: 200 });
  });

  await fetchMarketplacePackDetail('token-123', 'a slug/with special?chars');

  assert.ok(!seenUrl.includes(' '), 'slug must be URL-encoded, not passed raw');
});
