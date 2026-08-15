// Pure helpers for turning Promise.allSettled() results into a
// { value, error } shape, and turning an ApiError into user-facing copy.
// Kept dependency-free (no next/headers, no `@/` alias) so it can be unit
// tested directly with the plain Node test runner — see
// lib/api/__tests__/results.test.js.
import { ApiError } from './client.js';

export function settle(result) {
  if (result.status === 'fulfilled') {
    return { value: result.value, error: null };
  }
  return { value: null, error: result.reason };
}

export function errorMessage(error) {
  if (error instanceof ApiError) {
    return error.status === 0
      ? 'Unable to reach the Teracom AI backend.'
      : error.message || 'The backend returned an error.';
  }
  return 'Something went wrong loading this data.';
}

export function isForbidden(error) {
  return error instanceof ApiError && error.status === 403;
}
