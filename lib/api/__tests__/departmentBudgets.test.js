import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  submitDepartmentBudget,
  decideDepartmentBudget,
  fetchDepartmentBudgets,
} = await import('../departmentBudgets.js');

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

test('submitDepartmentBudget POSTs the payload to /department-budgets/', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'b1' }), { status: 200 });
  });

  await submitDepartmentBudget('tok', { department_id: 'd1', period_label: 'Q3 2026', amount_allocated: 5000 });

  assert.equal(seenUrl, 'https://backend.test/department-budgets/');
  assert.deepEqual(seenBody, { department_id: 'd1', period_label: 'Q3 2026', amount_allocated: 5000 });
});

test('decideDepartmentBudget POSTs {decision, notes} to /department-budgets/{id}/decide, omitting notes when not given', async () => {
  let seenUrl;
  let seenBody;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'b1', status: 'approved' }), { status: 200 });
  });

  await decideDepartmentBudget('tok', 'b1', 'approved');

  assert.equal(seenUrl, 'https://backend.test/department-budgets/b1/decide');
  assert.deepEqual(seenBody, { decision: 'approved' });
});

test('fetchDepartmentBudgets GETs /department-budgets/, including department_id as a query param when given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchDepartmentBudgets('tok', 'd1');

  assert.equal(seenUrl, 'https://backend.test/department-budgets/?department_id=d1');
});

test('fetchDepartmentBudgets omits department_id when not given', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchDepartmentBudgets('tok');

  assert.equal(seenUrl, 'https://backend.test/department-budgets/');
});
