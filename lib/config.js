// Server-only runtime configuration. Never import this from a 'use client' file:
// BACKEND_API_URL is intentionally not prefixed with NEXT_PUBLIC_ so it can never
// be inlined into the browser bundle.
if (typeof window !== 'undefined') {
  throw new Error('lib/config.js must only be imported from server-side code.');
}

export const BACKEND_API_URL = (
  process.env.BACKEND_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
