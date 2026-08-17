import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerCreationRequests } from '@/lib/api/workerCreationRequests';
import { errorMessage } from '@/lib/api/results';
import WorkerCreationRequestPanel from '@/components/portal/WorkerCreationRequestPanel';

export const metadata = {
  title: 'Worker Requests | Teracom AI Portal',
};

/**
 * Worker Lifecycle & Governance (Phase 0 Package PQR, objectives
 * #1-#3) — a second, optional path to a real Worker, sibling to the
 * pre-existing /portal/workers/new (direct admin creation, unchanged).
 */
export default async function WorkerCreationRequestsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Worker Requests</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view worker creation requests.</p>
          </div>
        </section>
      </main>
    );
  }

  let requests;
  try {
    requests = await fetchWorkerCreationRequests(token);
  } catch (error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="form-error" role="alert">
              {errorMessage(error)}
            </p>
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
            <h1>Propose a worker.</h1>
            <p className="lead">
              Any organisation member may propose a new worker; an admin decides whether to
              create it.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <WorkerCreationRequestPanel requests={requests ?? []} />
        </div>
      </section>
    </main>
  );
}
