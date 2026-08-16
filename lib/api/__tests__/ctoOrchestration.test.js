import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { planCtoTask, executeCtoTask, fetchCtoExecutions } = await import('../ctoOrchestration.js');

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

test('planCtoTask POSTs {primary_worker_id, objective} to /cto/plan, omitting max_hops when not given', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ available: true, steps: [], roadmap: [], truncated: false, reason: null }),
      { status: 200 }
    );
  });

  await planCtoTask('tok', 'w1', 'Review our firewall.');

  assert.equal(seenUrl, 'https://backend.test/cto/plan');
  assert.deepEqual(seenBody, { primary_worker_id: 'w1', objective: 'Review our firewall.' });
});

test('planCtoTask includes max_hops when given', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ available: true, steps: [], roadmap: [] }), { status: 200 });
  });

  await planCtoTask('tok', 'w1', 'Review our firewall.', 3);

  assert.deepEqual(seenBody, { primary_worker_id: 'w1', objective: 'Review our firewall.', max_hops: 3 });
});

test('executeCtoTask POSTs steps when provided, and omits the field when not', async () => {
  let seenBody;
  mockFetch(async (url, init) => {
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ execution_id: 'e1', steps: [], executive_synthesis: 'Done.' }),
      { status: 200 }
    );
  });

  await executeCtoTask('tok', 'w1', 'Review our firewall.', [{ worker_id: 'w2', subtask: 'Check it.' }]);
  assert.deepEqual(seenBody, {
    primary_worker_id: 'w1',
    objective: 'Review our firewall.',
    steps: [{ worker_id: 'w2', subtask: 'Check it.' }],
  });

  await executeCtoTask('tok', 'w1', 'Review our firewall.');
  assert.deepEqual(seenBody, { primary_worker_id: 'w1', objective: 'Review our firewall.' });
});

test('fetchCtoExecutions calls GET /cto/executions', async () => {
  let seenUrl;
  let seenHeaders;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenHeaders = init.headers;
    return new Response(JSON.stringify([]), { status: 200 });
  });

  const data = await fetchCtoExecutions('tok');

  assert.equal(seenUrl, 'https://backend.test/cto/executions');
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
  assert.deepEqual(data, []);
});
