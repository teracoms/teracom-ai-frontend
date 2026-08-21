import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import CreateWorkerForm from '@/components/portal/CreateWorkerForm';

export const metadata = {
  title: 'Create Worker | Teracom AI Portal',
};

export default function NewWorkerPage() {
  const token = getSessionToken();
  const isAdmin = token ? isAtLeastRole(decodeJwtPayload(token)?.role, 'admin') : false;

  // POST /workers/ is admin-only backend-side — this is a presentation-layer
  // gate only (per FRONTEND_ARCHITECTURE_V1.md §C.5), rendered as an
  // informational note rather than an error, matching the pattern already
  // established by OrganisationSummaryCard's restricted state.
  if (!isAdmin) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Workers</span>
            <h1>Creating a worker requires admin access.</h1>
            <p className="lead">
              Ask an organisation admin to create this worker, or sign in with an admin account.
            </p>
            <Link className="btn btn-secondary" href="/portal/workers">
              Back to Workers
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Workers</span>
            <h1>Create a new AI worker.</h1>
            <p className="lead">
              Its role, purpose and instructions become the system-prompt components
              teracom-ai-backend uses for every chat session with this worker.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CreateWorkerForm />
        </div>
      </section>
    </main>
  );
}
