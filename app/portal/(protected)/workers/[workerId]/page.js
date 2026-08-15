import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import {
  fetchWorkerSummary,
  fetchWorkerActivity,
  fetchWorkerKnowledge,
  fetchWorkerMemories,
  fetchKnowledgeCatalogue,
} from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import { ApiError } from '@/lib/api/client';
import StatTile from '@/components/portal/StatTile';
import EmptyState from '@/components/portal/EmptyState';
import EditWorkerForm from '@/components/portal/EditWorkerForm';
import WorkerKnowledgeAssignment from '@/components/portal/WorkerKnowledgeAssignment';

export const metadata = {
  title: 'Worker | Teracom AI Portal',
};

export default async function WorkerDetailPage({ params }) {
  const { workerId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Workers</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this worker.</p>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = decodeJwtPayload(token)?.role === 'admin';

  // Four independent, already ownership-checked backend calls (see
  // FRONTEND_ARCHITECTURE_V1.md §C.7) fired concurrently, same
  // Promise.allSettled + settle() pattern as the dashboard page — one
  // endpoint failing doesn't take down sections that succeeded.
  const [summaryResult, activityResult, knowledgeResult, memoriesResult, catalogueResult] =
    await Promise.allSettled([
      fetchWorkerSummary(token, workerId),
      fetchWorkerActivity(token, workerId),
      fetchWorkerKnowledge(token, workerId),
      fetchWorkerMemories(token, workerId),
      fetchKnowledgeCatalogue(token),
    ]);

  const summary = settle(summaryResult);
  const activity = settle(activityResult);
  const knowledge = settle(knowledgeResult);
  const memories = settle(memoriesResult);
  const catalogue = settle(catalogueResult);

  // GET /worker-summary/{id} is ownership-checked backend-side
  // (auth/organisation.get_owned_worker) — a worker that doesn't exist or
  // belongs to another organisation surfaces as 404 or 403. Since every
  // other call on this page is scoped to the same workerId, either failure
  // here takes down the whole page rather than degrading one section, and
  // both are shown as the same "not found" message so a cross-tenant ID
  // doesn't leak whether the worker exists elsewhere.
  if (summary.error) {
    const notFound =
      summary.error instanceof ApiError && [403, 404].includes(summary.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Workers</span>
            <h1>{notFound ? 'Worker not found.' : 'Unable to load this worker.'}</h1>
            <p className="lead">
              {notFound
                ? "This worker doesn't exist, or belongs to a different organisation."
                : errorMessage(summary.error)}
            </p>
            <Link className="btn btn-secondary" href="/portal/workers">
              Back to Workers
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const worker = summary.value.worker;
  const assignedIds = new Set((knowledge.value ?? []).map((item) => item.id));
  const available = (catalogue.value ?? []).filter((item) => !assignedIds.has(item.id));

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Worker</span>
            <h1>{worker.name}</h1>
            <p className="lead">
              <span className="badge">{worker.status}</span> {worker.role}
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-grid">
            <StatTile label="Knowledge assigned" value={summary.value.knowledge_count} />
            <StatTile label="Memories" value={summary.value.memory_count} />
            {!activity.error && (
              <>
                <StatTile label="Chat sessions" value={activity.value.chat_sessions} />
                <StatTile
                  label="Knowledge assignments"
                  value={activity.value.knowledge_assignments}
                />
              </>
            )}
          </div>
          {activity.error && (
            <p className="form-error" role="alert">
              {errorMessage(activity.error)}
            </p>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Purpose &amp; instructions</span>
            <h2>How this worker behaves.</h2>
          </div>
          <div className="worker-detail-columns">
            <div>
              <h3>Purpose</h3>
              <p>{worker.purpose}</p>
            </div>
            <div>
              <h3>Instructions</h3>
              <p>{worker.instructions}</p>
            </div>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="section">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Edit</span>
              <h2>Update worker details.</h2>
            </div>
            <EditWorkerForm worker={worker} />
          </div>
        </section>
      )}

      <section className={isAdmin ? 'section alt' : 'section'}>
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Knowledge</span>
            <h2>Assigned knowledge.</h2>
          </div>
          {knowledge.error ? (
            <p className="form-error" role="alert">
              {errorMessage(knowledge.error)}
            </p>
          ) : catalogue.error ? (
            <p className="form-error" role="alert">
              {errorMessage(catalogue.error)}
            </p>
          ) : (
            <WorkerKnowledgeAssignment
              workerId={workerId}
              assigned={knowledge.value ?? []}
              available={available}
            />
          )}
        </div>
      </section>

      <section className={isAdmin ? 'section' : 'section alt'}>
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Memory</span>
            <h2>What this worker remembers.</h2>
          </div>
          {memories.error ? (
            <p className="form-error" role="alert">
              {errorMessage(memories.error)}
            </p>
          ) : (memories.value ?? []).length === 0 ? (
            <EmptyState
              title="No memories yet"
              description="Facts get captured automatically during chat sessions with this worker."
            />
          ) : (
            <ul className="activity-list">
              {memories.value.map((memory) => (
                <li key={memory.id}>
                  <p className="activity-title">{memory.memory_content}</p>
                  <p className="activity-meta">Type: {memory.memory_type}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="card-action">
            <Link className="btn btn-secondary btn-small" href={`/portal/memory/${workerId}`}>
              Manage in Memory
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
