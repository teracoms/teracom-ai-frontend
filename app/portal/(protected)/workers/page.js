import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchWorkerList } from '@/lib/api/workers';
import { errorMessage } from '@/lib/api/results';
import WorkerListView from '@/components/portal/WorkerListView';

export const metadata = {
  title: 'Workers | Teracom AI Portal',
};

export default async function WorkersPage() {
  const token = getSessionToken();

  // Defensive only: app/portal/(protected)/layout.js already guarantees a
  // valid session before this page renders — see dashboard/page.js for the
  // same precedent.
  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Workers</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your workers.</p>
          </div>
        </section>
      </main>
    );
  }

  // POST /workers/ is admin-gated backend-side (require_role("admin")); the
  // JWT payload already carries `role` (see FRONTEND_ARCHITECTURE_V1.md §B.3),
  // so this reads it directly rather than making a second GET /auth/me call
  // just to decide whether to show the "Create Worker" link. Purely a
  // presentation-layer gate — the backend is the actual enforcement, per §C.5.
  const canCreate = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');

  let workers = [];
  let loadError = null;

  try {
    workers = await fetchWorkerList(token);
  } catch (error) {
    loadError = error;
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Workers</span>
            <h1>Your AI workforce.</h1>
            <p className="lead">
              Create, configure and assign knowledge to the AI worker agents that power your
              organisation&apos;s chat sessions.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : (
            <WorkerListView workers={workers} canCreate={canCreate} />
          )}
        </div>
      </section>
    </main>
  );
}
