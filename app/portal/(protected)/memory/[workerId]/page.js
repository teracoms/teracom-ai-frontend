import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerSummary, fetchWorkerMemories } from '@/lib/api/workers';
import { fetchMemorySummaries } from '@/lib/api/memorySummaries';
import { settle, errorMessage } from '@/lib/api/results';
import { ApiError } from '@/lib/api/client';
import AddMemoryForm from '@/components/portal/AddMemoryForm';
import MemoryListItem from '@/components/portal/MemoryListItem';
import MemorySummaryPanel from '@/components/portal/MemorySummaryPanel';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Worker Memory | Teracom AI Portal',
};

export default async function WorkerMemoryPage({ params }) {
  const { workerId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Memory</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this worker&apos;s memory.</p>
          </div>
        </section>
      </main>
    );
  }

  const [summaryResult, memoriesResult, summariesResult] = await Promise.allSettled([
    fetchWorkerSummary(token, workerId),
    fetchWorkerMemories(token, workerId),
    fetchMemorySummaries(token, 'worker', workerId),
  ]);

  const summary = settle(summaryResult);
  const memories = settle(memoriesResult);
  const memorySummaries = settle(summariesResult);

  // GET /worker-summary/{id} is ownership-checked backend-side — a worker
  // that doesn't exist or belongs to another organisation returns 404 or
  // 403, both collapsed to the same "not found" message, same precedent as
  // every prior package's detail page.
  if (summary.error) {
    const notFound = summary.error instanceof ApiError && [403, 404].includes(summary.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Memory</span>
            <h1>{notFound ? 'Worker not found.' : 'Unable to load this worker.'}</h1>
            <p className="lead">
              {notFound
                ? "This worker doesn't exist, or belongs to a different organisation."
                : errorMessage(summary.error)}
            </p>
            <Link className="btn btn-secondary" href="/portal/memory">
              Back to Memory
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const worker = summary.value.worker;

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Memory</span>
            <h1>{worker.name}</h1>
            <p className="lead">
              <span className="badge">{worker.status}</span> {worker.role}
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-secondary" href="/portal/memory">
              Back to Memory
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Add</span>
            <h2>Add a memory manually.</h2>
          </div>
          <AddMemoryForm workerId={workerId} />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Memories</span>
            <h2>What this worker remembers.</h2>
          </div>
          {memories.error ? (
            <p className="form-error" role="alert">
              {errorMessage(memories.error)}
            </p>
          ) : memories.value.length === 0 ? (
            <EmptyState
              title="No memories yet"
              description="Facts get captured automatically during chat sessions with this worker, or add one above."
            />
          ) : (
            <ul className="activity-list">
              {memories.value.map((memory) => (
                <MemoryListItem key={memory.id} memory={memory} workerId={workerId} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Retention</span>
            <h2>Long-term summaries.</h2>
          </div>
          {memorySummaries.error ? (
            <p className="form-error" role="alert">
              {errorMessage(memorySummaries.error)}
            </p>
          ) : (
            <MemorySummaryPanel scope="worker" scopeId={workerId} summaries={memorySummaries.value ?? []} />
          )}
        </div>
      </section>
    </main>
  );
}
