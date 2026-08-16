import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { suggestConsultation, consultWorker, fetchConsultations } = await import('../orchestration.js');

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

test('suggestConsultation POSTs {primary_worker_id, message} to /orchestration/suggest', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    seenHeaders = init.headers;
    return new Response(
      JSON.stringify({
        available: true,
        suggested: true,
        consulted_worker_id: 'w2',
        consulted_worker_name: 'Network Engineer',
        reason: 'Matches on: firewall',
      }),
      { status: 200 }
    );
  });

  const data = await suggestConsultation('tok', 'w1', 'Can you help with our firewall?');

  assert.equal(seenUrl, 'https://backend.test/orchestration/suggest');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, { primary_worker_id: 'w1', message: 'Can you help with our firewall?' });
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.equal(data.suggested, true);
  assert.equal(data.consulted_worker_name, 'Network Engineer');
});

test('consultWorker POSTs {primary_worker_id, consulted_worker_id, message} to /orchestration/consult', async () => {
  let seenUrl;
  let seenMethod;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        consultation_id: 'c1',
        consulted_worker_id: 'w2',
        consulted_worker_name: 'Network Engineer',
        consulted_worker_response: 'Check the switch port.',
        primary_worker_final_response: 'First check the switch port.',
      }),
      { status: 200 }
    );
  });

  const data = await consultWorker('tok', 'w1', 'w2', 'Help with our firewall.');

  assert.equal(seenUrl, 'https://backend.test/orchestration/consult');
  assert.equal(seenMethod, 'POST');
  assert.deepEqual(seenBody, {
    primary_worker_id: 'w1',
    consulted_worker_id: 'w2',
    message: 'Help with our firewall.',
  });
  assert.equal(data.consultation_id, 'c1');
});

test('fetchConsultations calls GET /orchestration/consultations', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(JSON.stringify([]), { status: 200 });
  });

  const data = await fetchConsultations('tok');

  assert.equal(seenUrl, 'https://backend.test/orchestration/consultations');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.deepEqual(data, []);
});
