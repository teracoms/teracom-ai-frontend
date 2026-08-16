import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerSummary, fetchWorkerList } from '@/lib/api/workers';
import { fetchConsultations } from '@/lib/api/orchestration';
import { errorMessage, settle } from '@/lib/api/results';
import { ApiError } from '@/lib/api/client';
import ChatInterface from '@/components/portal/ChatInterface';
import OrchestrationHistory from '@/components/portal/OrchestrationHistory';

export const metadata = {
  title: 'Chat | Teracom AI Portal',
};

export default async function WorkerChatPage({ params }) {
  const { workerId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Chat</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to chat with this worker.</p>
          </div>
        </section>
      </main>
    );
  }

  let summary = null;
  let loadError = null;

  try {
    summary = await fetchWorkerSummary(token, workerId);
  } catch (error) {
    loadError = error;
  }

  // GET /worker-summary/{id} is ownership-checked backend-side — a worker
  // that doesn't exist or belongs to another organisation returns 404 or
  // 403, both collapsed to the same "not found" message, same precedent as
  // the Workers and Knowledge detail pages.
  if (loadError) {
    const notFound = loadError instanceof ApiError && [403, 404].includes(loadError.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Chat</span>
            <h1>{notFound ? 'Worker not found.' : 'Unable to load this worker.'}</h1>
            <p className="lead">
              {notFound
                ? "This worker doesn't exist, or belongs to a different organisation."
                : errorMessage(loadError)}
            </p>
            <Link className="btn btn-secondary" href="/portal/chat">
              Back to Chat
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const worker = summary.worker;

  // Per-section resilience (ADR-008): the consultation history is
  // supplementary to the chat page itself, so a failure here shouldn't
  // block the page from rendering the live chat.
  const [consultationsSettled, workerListSettled] = await Promise.allSettled([
    fetchConsultations(token),
    fetchWorkerList(token),
  ]);
  const consultationsResult = settle(consultationsSettled);
  const allConsultations = consultationsResult.value ?? [];
  const consultations = allConsultations.filter((entry) => entry.primary_worker_id === workerId);
  const workerNamesById = new Map(
    (workerListSettled.status === 'fulfilled' ? workerListSettled.value : []).map((w) => [w.id, w.name])
  );

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Chat</span>
            <h1>{worker.name}</h1>
            <p className="lead">
              <span className="badge">{worker.status}</span> {worker.role}
            </p>
            <p>
              Drawing on {summary.knowledge_count} knowledge document
              {summary.knowledge_count === 1 ? '' : 's'} and {summary.memory_count} remembered
              fact
              {summary.memory_count === 1 ? '' : 's'} assigned to this worker.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ChatInterface workerId={workerId} />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Orchestration Intelligence</span>
            <h2>Consultation History</h2>
            <p>Past consultations this worker has run with a colleague worker, on your approval.</p>
          </div>

          {consultationsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(consultationsResult.error)}
            </p>
          ) : (
            <OrchestrationHistory consultations={consultations} workerNamesById={workerNamesById} />
          )}
        </div>
      </section>
    </main>
  );
}
