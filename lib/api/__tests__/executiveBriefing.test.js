import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { fetchExecutiveBriefingSummary } = await import('../executiveBriefing.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

test('fetchExecutiveBriefingSummary GETs /executive-briefing/summary', async () => {
  let seenUrl;
  global.fetch = async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({}), { status: 200 });
  };

  await fetchExecutiveBriefingSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/executive-briefing/summary');
});
