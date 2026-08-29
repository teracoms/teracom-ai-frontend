import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const {
  fetchProtectionDashboard,
  fetchStorageVisibility,
  fetchBackupHistory,
  triggerBackupNow,
  fetchTenantExport,
} = await import('../protection.js');

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

test('fetchProtectionDashboard calls GET /protection/dashboard', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ protection_score: null }), { status: 200 });
  });

  await fetchProtectionDashboard('tok');

  assert.equal(seenUrl, 'https://backend.test/protection/dashboard');
});

test('fetchStorageVisibility calls GET /protection/storage', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ total_protected_bytes: 0 }), { status: 200 });
  });

  await fetchStorageVisibility('tok');

  assert.equal(seenUrl, 'https://backend.test/protection/storage');
});

test('fetchBackupHistory calls GET /protection/backup-history', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify([]), { status: 200 });
  });

  await fetchBackupHistory('tok');

  assert.equal(seenUrl, 'https://backend.test/protection/backup-history');
});

test('triggerBackupNow POSTs to /protection/backup-history/run', async () => {
  let seenUrl;
  let seenMethod;
  mockFetch(async (url, init) => {
    seenUrl = url.toString();
    seenMethod = init.method;
    return new Response(JSON.stringify({ id: 'b1', status: 'success' }), { status: 200 });
  });

  const data = await triggerBackupNow('tok');

  assert.equal(seenUrl, 'https://backend.test/protection/backup-history/run');
  assert.equal(seenMethod, 'POST');
  assert.equal(data.status, 'success');
});

test('fetchTenantExport calls GET /protection/tenant-export', async () => {
  let seenUrl;
  mockFetch(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ organisation_id: 'org-1', row_counts: {} }), { status: 200 });
  });

  const data = await fetchTenantExport('tok');

  assert.equal(seenUrl, 'https://backend.test/protection/tenant-export');
  assert.equal(data.organisation_id, 'org-1');
});
