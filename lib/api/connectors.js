// Server-only connector data access, per FRONTEND_ARCHITECTURE_V1.md §C.8.
//
// Verified directly against teracom-ai-backend source before writing
// anything here (api/connectors.py, api/connector_status.py,
// services/connector_status_service.py, services/connectors/*.py) — see
// CONNECTORS_IMPLEMENTATION_REPORT.md §2 for the full findings. Headline
// fact: every connector endpoint returns a hardcoded literal, identical for
// every organisation and every user, with no OAuth, no Microsoft Graph call,
// and no per-org state anywhere behind it.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/connectors.js must only be used on the server.');
}

import { backendFetch } from './client.js';

/**
 * GET /connector-status/ returns all three connectors' status in one call
 * (services/connector_status_service.py#connector_status() — a hardcoded
 * `{sharepoint: "available", onedrive: "available", teams: "available"}`
 * literal, not derived from any real check). teracom-ai-backend also exposes
 * three near-duplicate per-connector endpoints (GET /connectors/sharepoint,
 * /connectors/onedrive, /connectors/teams), each returning the identical
 * `{connector, status: "available"}` shape for that one connector — this
 * module deliberately calls only the one aggregate endpoint, the same
 * "pick one canonical source, don't call every near-duplicate" principle
 * Package 2 already established for the dashboard's five overlapping
 * aggregate endpoints.
 */
export async function fetchConnectorStatus(token) {
  return backendFetch('/connector-status/', { token });
}
