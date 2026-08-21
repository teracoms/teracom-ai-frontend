// Server-only fetch wrapper for teracom-ai-backend. Route Handlers and Server
// Components call through here so the backend base URL and bearer token never
// reach the browser — see FRONTEND_ARCHITECTURE_V1.md §C.4.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/client.js must only be used on the server.');
}

// Relative (not `@/...`) import so this module can also be loaded directly by
// the plain Node test runner (`npm test`), which doesn't understand Next.js's
// path aliases.
import { BACKEND_API_URL } from '../config.js';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path, searchParams) {
  const url = new URL(`${BACKEND_API_URL}${path.startsWith('/') ? path : `/${path}`}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Call the Teracom AI backend. Throws ApiError for both network failures
 * (status 0) and non-2xx responses (status = the HTTP status code), so
 * callers can branch on `error.status` without inspecting error strings.
 */
export async function backendFetch(path, options = {}) {
  const { method = 'GET', token, body, searchParams, cache = 'no-store', headers: extraHeaders } = options;

  const url = buildUrl(path, searchParams);

  // Multipart bodies (Package 4's document upload, POST /upload/) are passed
  // as a FormData instance — sent as-is, with no Content-Type header, so
  // fetch sets the multipart boundary itself. Every other caller still sends
  // a plain object, JSON-stringified as before.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers = { Accept: 'application/json' };
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  // No caller in this repo passes extraHeaders today — the one that
  // originally needed it (the Stripe webhook handler, sending a shared
  // service secret via X-Internal-Service-Token instead of a user
  // session token) moved to teracom-solutions-website in the
  // Website/Application Separation's Phase 4. This file is duplicated
  // (not a shared package) between that repo and this one; kept here so
  // the two copies don't diverge for no reason.
  if (extraHeaders) Object.assign(headers, extraHeaders);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      cache,
    });
  } catch (cause) {
    throw new ApiError('Unable to reach the Teracom AI backend.', 0, {
      cause: cause instanceof Error ? cause.message : String(cause),
    });
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const detail = data && (data.detail || data.error);
    const message = typeof detail === 'string' ? detail : response.statusText || 'Request failed';

    throw new ApiError(message, response.status, {
      retryAfter: response.headers.get('Retry-After'),
      body: data,
    });
  }

  return data;
}
