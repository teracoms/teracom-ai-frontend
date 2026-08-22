import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchDepartments } from '@/lib/api/departments';
import { settle, errorMessage } from '@/lib/api/results';
import WorkerListView from '@/components/portal/WorkerListView';
import ConceptHelp from '@/components/portal/ConceptHelp';
import WorkforceNav from '@/components/portal/WorkforceNav';

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

  // UI_IMPLEMENTATION_SPRINT_1.md item 7/8 -- department ownership wasn't
  // visible anywhere on the worker list. Best-effort: a departments-fetch
  // failure shouldn't block the worker list itself from rendering, since
  // WorkerCard already falls back to "Unassigned" for a missing lookup.
  const [departmentsSettled] = await Promise.allSettled([fetchDepartments(token)]);
  const departments = settle(departmentsSettled);
  // A plain object, not a Map -- keeps this a safe, ordinary prop across
  // the server/client boundary into the client-side WorkerListView below.
  const departmentNamesById = Object.fromEntries(
    (departments.value ?? []).map((department) => [department.id, department.name])
  );

  return (
    <>
      <WorkforceNav />
      <main>
      <section className="hero hero-product hero-workforce">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Workers</span>
            <h1>
              Your AI workforce.
              <ConceptHelp concept="workers" />
            </h1>
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
            <WorkerListView workers={workers} canCreate={canCreate} departmentNamesById={departmentNamesById} />
          )}
        </div>
      </section>
    </main>
    </>
  );
}
