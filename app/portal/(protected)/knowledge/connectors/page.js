import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchConnectorStatus } from '@/lib/api/connectors';
import { errorMessage } from '@/lib/api/results';
import ConnectorCard from '@/components/portal/ConnectorCard';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Connectors | Teracom AI Portal',
};

/**
 * Verified directly against teracom-ai-backend source before building this
 * page (api/connectors.py, api/connector_status.py,
 * services/connector_status_service.py, services/connectors/*.py) — see
 * CONNECTORS_IMPLEMENTATION_REPORT.md §2. Every connector here is a
 * disabled "coming soon" card, matching the real backend state
 * (100% hardcoded stub responses, no OAuth, no real sync) rather than
 * implying a working connect flow that doesn't exist.
 */
export default async function ConnectorsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Connectors</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view connectors.</p>
          </div>
        </section>
      </main>
    );
  }

  let statuses = {};
  let loadError = null;

  try {
    statuses = await fetchConnectorStatus(token);
  } catch (error) {
    loadError = error;
  }

  // Derived from whatever keys the backend actually returns, rather than a
  // hardcoded sharepoint/onedrive/teams list, so this page doesn't silently
  // drift out of sync if a connector is ever added or removed backend-side.
  const connectors = Object.entries(statuses ?? {});

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Connectors</span>
            <h1>External source connectors.</h1>
            <p className="lead">
              SharePoint, OneDrive and Teams integrations are planned but not yet built — there&apos;s
              no working OAuth or sync for any of them today. Upload documents directly until
              these are available.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-secondary" href="/portal/knowledge">
              Back to Knowledge
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : connectors.length === 0 ? (
            <EmptyState
              title="No connectors are registered"
              description="Teracom AI has no connector status to report right now."
            />
          ) : (
            <div className="product-grid">
              {connectors.map(([id, status]) => (
                <ConnectorCard key={id} id={id} status={status} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
