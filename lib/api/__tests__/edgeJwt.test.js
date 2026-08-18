import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decodeExpiry } from '../edgeJwt.js';

function encodeSegment(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function fakeJwt(payload) {
  const header = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const body = encodeSegment(payload);
  return `${header}.${body}.signature-not-verified`;
}

// "Package SEC1" — decodeExpiry is middleware.js's Edge-safe (no
// Buffer) equivalent of jwt.js's decodeJwtPayload/getTokenExpirySeconds,
// used only to decide *whether* to silently refresh an access token
// before it reaches a protected route.

test('decodeExpiry reads the exp claim from a well-formed token', () => {
  const token = fakeJwt({ sub: 'user-1', exp: 1999999999 });
  assert.equal(decodeExpiry(token), 1999999999);
});

test('decodeExpiry returns null when exp is missing', () => {
  const token = fakeJwt({ sub: 'user-1' });
  assert.equal(decodeExpiry(token), null);
});

test('decodeExpiry returns null for non-string input', () => {
  assert.equal(decodeExpiry(undefined), null);
  assert.equal(decodeExpiry(null), null);
  assert.equal(decodeExpiry(42), null);
});

test('decodeExpiry returns null for a malformed token', () => {
  assert.equal(decodeExpiry('not-a-jwt'), null);
  assert.equal(decodeExpiry('only.one-dot-missing'), null);
  assert.equal(decodeExpiry('aGVhZGVy.not-valid-base64url-json!!!.sig'), null);
});
