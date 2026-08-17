// Server-only, Customer Portal (Phase 0 Package O) — read-only.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/portalContactProjects.js must only be used on the server.');
}

import { backendFetch } from './client.js';

export async function fetchPortalContactProjects(token) {
  return backendFetch('/portal-contact/projects', { token });
}
