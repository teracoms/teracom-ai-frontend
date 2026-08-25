import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { errorMessage } from '@/lib/api/results';
import { pickDefaultWorker } from '@/lib/portalInitiative';
import ChatInterface from '@/components/portal/ChatInterface';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Chat with Orchestrator | Teracom AI Portal',
};

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- "Chat with Orchestrator" from the new
// primary dashboard. There is no single "Orchestrator" worker entity in the
// data model -- conversation is per-worker (POST /chat/, worker_id
// required) -- so this page picks a sensible default worker
// (pickDefaultWorker(), the same heuristic the Initiative flow uses) and
// presents that conversation under the friendly "Orchestrator" framing the
// customer actually asked for, reusing ChatInterface exactly as
// /portal/chat's own per-worker chat already does (including its Orchestration
// Intelligence colleague-consultation panel -- a real fit here, since asking
// "the Orchestrator" a question that another worker could help with is
// precisely that feature's own purpose).
export default async function OrchestratorPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Orchestrator</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  let workers = [];
  let loadError = null;
  try {
    workers = await fetchWorkerList(token);
  } catch (error) {
    loadError = error;
  }

  const orchestratorWorker = pickDefaultWorker(workers, '');

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/dashboard">&larr; Dashboard</Link>
            </span>
            <h1>Chat with Orchestrator</h1>
            <p className="lead">
              Ask for anything — it can bring in a colleague worker automatically when a question
              needs one.
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
          ) : !orchestratorWorker ? (
            <EmptyState
              title="No workers yet"
              description="Create a worker first, then come back here to chat."
            />
          ) : (
            <ChatInterface workerId={orchestratorWorker.id} />
          )}
        </div>
      </section>
    </main>
  );
}
