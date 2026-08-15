import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decodeJwtPayload, getTokenExpirySeconds } from '../jwt.js';

function encodeSegment(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function fakeJwt(payload) {
  const header = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const body = encodeSegment(payload);
  return `${header}.${body}.signature-not-verified`;
}

test('decodeJwtPayload decodes a well-formed token payload', () => {
  const token = fakeJwt({ sub: 'user-1', email: 'a@example.com', exp: 1999999999 });
  const payload = decodeJwtPayload(token);

  assert.deepEqual(payload, { sub: 'user-1', email: 'a@example.com', exp: 1999999999 });
});

test('decodeJwtPayload returns null for non-string input', () => {
  assert.equal(decodeJwtPayload(undefined), null);
  assert.equal(decodeJwtPayload(null), null);
  assert.equal(decodeJwtPayload(42), null);
});

test('decodeJwtPayload returns null for a malformed token', () => {
  assert.equal(decodeJwtPayload('not-a-jwt'), null);
  assert.equal(decodeJwtPayload('only.one-dot-missing'), null);
  assert.equal(decodeJwtPayload('aGVhZGVy.not-valid-base64url-json!!!.sig'), null);
});

test('getTokenExpirySeconds returns the exp claim when present', () => {
  const token = fakeJwt({ sub: 'user-1', exp: 1700000000 });
  assert.equal(getTokenExpirySeconds(token), 1700000000);
});

test('getTokenExpirySeconds returns null when exp is missing or invalid', () => {
  assert.equal(getTokenExpirySeconds(fakeJwt({ sub: 'user-1' })), null);
  assert.equal(getTokenExpirySeconds('garbage'), null);
});
