import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { consultDepartmentHeads, fetchDepartmentHeadConsultations } = await import('../departmentHeads.js');

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

test('consultDepartmentHeads POSTs {primary_worker_id, consulted_worker_id, message} to /department-heads/consult', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ consultation_id: 'c1' }), { status: 200 });
  });

  await consultDepartmentHeads('tok', 'w1', 'w2', 'How should we align?');

  assert.equal(seenUrl, 'https://backend.test/department-heads/consult');
  assert.deepEqual(seenBody, {
    primary_worker_id: 'w1',
    consulted_worker_id: 'w2',
    message: 'How should we align?',
  });
});

test('fetchDepartmentHeadConsultations GETs /department-heads/consultations', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchDepartmentHeadConsultations('tok');

  assert.equal(seenUrl, 'https://backend.test/department-heads/consultations');
});
