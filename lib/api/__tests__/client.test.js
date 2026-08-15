import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// BACKEND_API_URL is read once at module load time by lib/config.js, so it
// must be set before the first import of lib/api/client.js.
process.env.BACKEND_API_URL = 'https://backend.test';

const { backendFetch, ApiError } = await import('../client.js');

let originalFetch;

before(() => {
  originalFetch = global.fetch;
});

after(() => {
  global.fetch = originalFetch;
});

function mockFetchOnce(handler) {
  global.fetch = async (url, init) => handler(url, init);
}

test('ApiError carries message, status and details', () => {
  const error = new ApiError('nope', 403, { body: { detail: 'nope' } });
  assert.equal(error.name, 'ApiError');
  assert.equal(error.message, 'nope');
  assert.equal(error.status, 403);
  assert.deepEqual(error.details, { body: { detail: 'nope' } });
  assert.ok(error instanceof Error);
});

test('backendFetch resolves parsed JSON on a 2xx response', async () => {
  mockFetchOnce(async (url) => {
    assert.equal(url.toString(), 'https://backend.test/auth/me');
    return new Response(JSON.stringify({ id: '1', email: 'a@example.com' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const data = await backendFetch('/auth/me', { token: 'abc' });
  assert.deepEqual(data, { id: '1', email: 'a@example.com' });
});

test('backendFetch attaches the Authorization header when a token is given', async () => {
  let seenHeaders;
  mockFetchOnce(async (url, init) => {
    seenHeaders = init.headers;
    return new Response('{}', { status: 200 });
  });

  await backendFetch('/workers/', { token: 'my-token' });
  assert.equal(seenHeaders.Authorization, 'Bearer my-token');
});

test('backendFetch serialises searchParams onto the URL query string', async () => {
  let seenUrl;
  mockFetchOnce(async (url) => {
    seenUrl = url.toString();
    return new Response(JSON.stringify({ access_token: 't' }), { status: 200 });
  });

  await backendFetch('/auth/login', {
    method: 'POST',
    searchParams: { email: 'a@example.com', password: 'hunter2' },
  });

  assert.equal(
    seenUrl,
    'https://backend.test/auth/login?email=a%40example.com&password=hunter2'
  );
});

test('backendFetch throws ApiError with the backend status and detail message on a non-2xx response', async () => {
  mockFetchOnce(async () =>
    new Response(JSON.stringify({ detail: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  );

  await assert.rejects(
    () => backendFetch('/auth/login', { method: 'POST' }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      assert.equal(error.message, 'Invalid credentials');
      return true;
    }
  );
});

test('backendFetch surfaces the Retry-After header on a 429 response', async () => {
  mockFetchOnce(async () =>
    new Response(JSON.stringify({ detail: 'Too many attempts' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '900' },
    })
  );

  await assert.rejects(
    () => backendFetch('/auth/login', { method: 'POST' }),
    (error) => {
      assert.equal(error.status, 429);
      assert.equal(error.details.retryAfter, '900');
      return true;
    }
  );
});

test('backendFetch sends a FormData body as-is, without JSON.stringify or a Content-Type override', async () => {
  let seenBody;
  let seenHeaders;
  mockFetchOnce(async (url, init) => {
    seenBody = init.body;
    seenHeaders = init.headers;
    return new Response(JSON.stringify({ filename: 'a.txt', status: 'ok' }), { status: 200 });
  });

  const formData = new FormData();
  formData.set('worker_id', 'w1');

  await backendFetch('/upload/', { method: 'POST', token: 'tok', body: formData });

  assert.equal(seenBody, formData);
  assert.equal(seenHeaders['Content-Type'], undefined);
  assert.equal(seenHeaders.Authorization, 'Bearer tok');
});

test('backendFetch wraps a network failure as ApiError with status 0', async () => {
  mockFetchOnce(async () => {
    throw new TypeError('fetch failed');
  });

  await assert.rejects(
    () => backendFetch('/health/'),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 0);
      return true;
    }
  );
});
