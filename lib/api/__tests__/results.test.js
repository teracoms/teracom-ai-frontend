import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.BACKEND_API_URL = 'https://backend.test';

const { ApiError } = await import('../client.js');
const { settle, errorMessage, isForbidden } = await import('../results.js');

test('settle unwraps a fulfilled Promise.allSettled result', () => {
  const result = settle({ status: 'fulfilled', value: { workers: 3 } });
  assert.deepEqual(result, { value: { workers: 3 }, error: null });
});

test('settle unwraps a rejected Promise.allSettled result', () => {
  const error = new ApiError('nope', 500);
  const result = settle({ status: 'rejected', reason: error });
  assert.deepEqual(result, { value: null, error });
});

test('errorMessage reports a network failure distinctly from a backend error', () => {
  assert.equal(
    errorMessage(new ApiError('irrelevant', 0)),
    'Unable to reach the Teracom AI backend.'
  );
  assert.equal(errorMessage(new ApiError('Insufficient permissions', 403)), 'Insufficient permissions');
});

test('errorMessage falls back to a generic message for a non-ApiError', () => {
  assert.equal(errorMessage(new Error('boom')), 'Something went wrong loading this data.');
  assert.equal(errorMessage(null), 'Something went wrong loading this data.');
});

test('isForbidden is true only for a 403 ApiError', () => {
  assert.equal(isForbidden(new ApiError('nope', 403)), true);
  assert.equal(isForbidden(new ApiError('nope', 401)), false);
  assert.equal(isForbidden(new Error('boom')), false);
  assert.equal(isForbidden(null), false);
});
