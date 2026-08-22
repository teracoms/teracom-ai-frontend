import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isSecureRequest } from '../requestProtocol.js';

function fakeRequest({ url, forwardedProto } = {}) {
  return {
    url,
    headers: {
      get(name) {
        if (name === 'x-forwarded-proto') return forwardedProto ?? null;
        return null;
      },
    },
  };
}

test('X-Forwarded-Proto: https marks the request secure, regardless of the literal URL scheme', () => {
  const request = fakeRequest({ url: 'http://127.0.0.1:3000/api/auth/login', forwardedProto: 'https' });
  assert.equal(isSecureRequest(request), true);
});

test('X-Forwarded-Proto: http marks the request not secure, regardless of the literal URL scheme', () => {
  const request = fakeRequest({ url: 'https://app.teracomsolutions.com.au/api/auth/login', forwardedProto: 'http' });
  assert.equal(isSecureRequest(request), false);
});

test('a proxy chain (comma-separated X-Forwarded-Proto) uses the first hop', () => {
  const request = fakeRequest({ url: 'http://127.0.0.1:3000/api/auth/login', forwardedProto: 'https, http' });
  assert.equal(isSecureRequest(request), true);
});

test('X-Forwarded-Proto is matched case-insensitively', () => {
  const request = fakeRequest({ url: 'http://127.0.0.1:3000/api/auth/login', forwardedProto: 'HTTPS' });
  assert.equal(isSecureRequest(request), true);
});

test('with no X-Forwarded-Proto header, falls back to the request URL scheme -- https', () => {
  const request = fakeRequest({ url: 'https://127.0.0.1:3000/api/auth/login' });
  assert.equal(isSecureRequest(request), true);
});

test('with no X-Forwarded-Proto header, falls back to the request URL scheme -- http (today\'s un-proxied deployment)', () => {
  const request = fakeRequest({ url: 'http://127.0.0.1:3000/api/auth/login' });
  assert.equal(isSecureRequest(request), false);
});

test('never secure by virtue of NODE_ENV alone -- production with a plain-HTTP request is still not secure', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const request = fakeRequest({ url: 'http://127.0.0.1:3000/api/auth/login' });
    assert.equal(isSecureRequest(request), false);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
});
