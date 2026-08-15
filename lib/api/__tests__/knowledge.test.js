import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchKnowledgeSummary,
  fetchKnowledgeGrowth,
  fetchKnowledgeAssignmentsSummary,
  fetchDocument,
  deleteDocument,
  reindexDocument,
  fetchUploadHistory,
  fetchUploadMetrics,
  uploadKnowledgeDocument,
  semanticSearch,
} = await import('../knowledge.js');

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

test('fetchKnowledgeSummary calls GET /knowledge-summary/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ total_documents: 4 }), { status: 200 });
  });

  const data = await fetchKnowledgeSummary('tok');

  assert.equal(seenUrl, 'https://backend.test/knowledge-summary/');
  assert.deepEqual(data, { total_documents: 4 });
});

test('fetchKnowledgeGrowth calls GET /knowledge-growth/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ total_knowledge: 4 }), { status: 200 });
  });

  await fetchKnowledgeGrowth('tok');
  assert.equal(seenUrl, 'https://backend.test/knowledge-growth/');
});

test('fetchKnowledgeAssignmentsSummary calls GET /knowledge-assignments/summary', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ total_assignments: 2 }), { status: 200 });
  });

  await fetchKnowledgeAssignmentsSummary('tok');
  assert.equal(seenUrl, 'https://backend.test/knowledge-assignments/summary');
});

test('fetchDocument calls GET /documents/{documentId} with the bearer token', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(
      JSON.stringify({ id: 'k1', title: 'Vendor Pricing', content: 'text', source: 'upload' }),
      { status: 200 }
    );
  });

  const data = await fetchDocument('tok', 'k1');

  assert.equal(seenUrl, 'https://backend.test/documents/k1');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.deepEqual(data, { id: 'k1', title: 'Vendor Pricing', content: 'text', source: 'upload' });
});

test('deleteDocument DELETEs /documents/{documentId}', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ deleted: true }), { status: 200 });
  });

  const data = await deleteDocument('tok', 'k1');

  assert.equal(seenUrl, 'https://backend.test/documents/k1');
  assert.equal(seenMethod, 'DELETE');
  assert.deepEqual(data, { deleted: true });
});

test('reindexDocument POSTs /documents/reindex/{documentId}', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ reindexed: true }), { status: 200 });
  });

  const data = await reindexDocument('tok', 'k1');

  assert.equal(seenUrl, 'https://backend.test/documents/reindex/k1');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(data, { reindexed: true });
});

test('fetchUploadHistory calls GET /upload-history/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchUploadHistory('tok');
  assert.equal(seenUrl, 'https://backend.test/upload-history/');
});

test('fetchUploadMetrics calls GET /upload-metrics/', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ uploaded_documents: 1 }), { status: 200 });
  });

  await fetchUploadMetrics('tok');
  assert.equal(seenUrl, 'https://backend.test/upload-metrics/');
});

test('uploadKnowledgeDocument POSTs the given FormData as-is to /upload/, with no Content-Type override', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = init.body;
    seenHeaders = init.headers;
    return new Response(
      JSON.stringify({ filename: 'sample.txt', status: 'knowledge created, assigned and indexed (12 chars)' }),
      { status: 200 }
    );
  });

  const formData = new FormData();
  formData.set('worker_id', 'w1');

  const data = await uploadKnowledgeDocument('tok', formData);

  assert.equal(seenUrl, 'https://backend.test/upload/');
  assert.equal(seenMethod, 'POST');
  assert.equal(seenBody, formData);
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.equal(seenHeaders['Content-Type'], undefined);
  assert.deepEqual(data, {
    filename: 'sample.txt',
    status: 'knowledge created, assigned and indexed (12 chars)',
  });
});

test('semanticSearch POSTs {query} as a JSON body to /search/', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ results: [{ id: 'k1', title: 'Vendor Pricing', snippet: 'text', distance: 0.12 }] }),
      { status: 200 }
    );
  });

  const data = await semanticSearch('tok', 'vendor pricing');

  assert.equal(seenUrl, 'https://backend.test/search/');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, { query: 'vendor pricing' });
  assert.deepEqual(data, {
    results: [{ id: 'k1', title: 'Vendor Pricing', snippet: 'text', distance: 0.12 }],
  });
});
