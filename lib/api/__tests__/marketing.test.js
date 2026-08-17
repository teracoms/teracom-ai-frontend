import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  createCampaign,
  fetchCampaigns,
  fetchCampaign,
  updateCampaignStage,
  fetchMarketingSummary,
} = await import('../marketing.js');

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

test('createCampaign POSTs the payload to /campaigns/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'c1' }), { status: 200 });
  });

  await createCampaign('tok', { name: 'Q3 Launch' });

  assert.equal(seenUrl, 'https://backend.test/campaigns/');
  assert.deepEqual(seenBody, { name: 'Q3 Launch' });
});

test('fetchCampaigns GETs /campaigns/, including a stage query param when given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchCampaigns('tok', 'active');

  assert.equal(seenUrl, 'https://backend.test/campaigns/?stage=active');
});

test('fetchCampaigns omits the stage query param when not given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchCampaigns('tok');

  assert.equal(seenUrl, 'https://backend.test/campaigns/');
});

test('fetchCampaign GETs /campaigns/{id}', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'c1' }), { status: 200 });
  });

  await fetchCampaign('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/campaigns/c1');
});

test('updateCampaignStage PATCHes {stage} to /campaigns/{id}/stage', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'c1', stage: 'active' }), { status: 200 });
  });

  await updateCampaignStage('tok', 'c1', 'active');

  assert.equal(seenUrl, 'https://backend.test/campaigns/c1/stage');
  assert.equal(seenMethod, 'PATCH');
  assert.deepEqual(seenBody, { stage: 'active' });
});

test('fetchMarketingSummary GETs /marketing/summary', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ campaign_stage_counts: {} }), { status: 200 });
  });

  await fetchMarketingSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/marketing/summary');
});
