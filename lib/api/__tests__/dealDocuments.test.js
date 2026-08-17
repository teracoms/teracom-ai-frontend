import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  submitProposal,
  draftProposal,
  submitDraftedProposal,
  decideProposal,
  fetchProposals,
  submitQuote,
  decideQuote,
  fetchQuotes,
  submitContract,
  decideContract,
  fetchContracts,
} = await import('../dealDocuments.js');

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

test('submitProposal POSTs the payload to /proposals/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1' }), { status: 200 });
  });

  await submitProposal('tok', { crm_contact_id: 'c1', title: 'T', content: 'C' });

  assert.equal(seenUrl, 'https://backend.test/proposals/');
  assert.deepEqual(seenBody, { crm_contact_id: 'c1', title: 'T', content: 'C' });
});

test('draftProposal POSTs the payload to /proposals/draft with worker_id as a query param', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1', status: 'draft' }), { status: 200 });
  });

  await draftProposal('tok', 'w1', { crm_contact_id: 'c1', title: 'T', brief: 'B' });

  assert.equal(seenUrl, 'https://backend.test/proposals/draft?worker_id=w1');
  assert.deepEqual(seenBody, { crm_contact_id: 'c1', title: 'T', brief: 'B' });
});

test('submitDraftedProposal POSTs to /proposals/{id}/submit', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 'p1', status: 'submitted' }), { status: 200 });
  });

  await submitDraftedProposal('tok', 'p1');

  assert.equal(seenUrl, 'https://backend.test/proposals/p1/submit');
  assert.equal(seenMethod, 'POST');
});

test('decideProposal POSTs {decision, notes} to /proposals/{id}/decide, omitting notes when not given', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'p1', status: 'approved' }), { status: 200 });
  });

  await decideProposal('tok', 'p1', 'approved');

  assert.deepEqual(seenBody, { decision: 'approved' });
});

test('fetchProposals GETs /proposals/ with crm_contact_id as a query param', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchProposals('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/proposals/?crm_contact_id=c1');
});

test('submitQuote POSTs the payload to /quotes/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'q1' }), { status: 200 });
  });

  await submitQuote('tok', { crm_contact_id: 'c1', title: 'T', content: 'C' });

  assert.equal(seenUrl, 'https://backend.test/quotes/');
});

test('decideQuote POSTs {decision} to /quotes/{id}/decide', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'q1' }), { status: 200 });
  });

  await decideQuote('tok', 'q1', 'rejected');

  assert.equal(seenUrl, 'https://backend.test/quotes/q1/decide');
});

test('fetchQuotes GETs /quotes/ with crm_contact_id as a query param', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchQuotes('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/quotes/?crm_contact_id=c1');
});

test('submitContract POSTs the payload to /contracts/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'k1' }), { status: 200 });
  });

  await submitContract('tok', { crm_contact_id: 'c1', title: 'T', content: 'C' });

  assert.equal(seenUrl, 'https://backend.test/contracts/');
});

test('decideContract POSTs {decision} to /contracts/{id}/decide', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ id: 'k1' }), { status: 200 });
  });

  await decideContract('tok', 'k1', 'approved');

  assert.equal(seenUrl, 'https://backend.test/contracts/k1/decide');
});

test('fetchContracts GETs /contracts/ with crm_contact_id as a query param', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchContracts('tok', 'c1');

  assert.equal(seenUrl, 'https://backend.test/contracts/?crm_contact_id=c1');
});
