import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerSummary, fetchWorkerMemories } from '@/lib/api/workers';
import { settle } from '@/lib/api/results';
import { ApiError } from '@/lib/api/client';

export const metadata = {
  title: 'Memory | Teracom AI Portal',
};

/**
 * teracom-ai-backend has no GET-a-single-memory-by-id endpoint — only
 * GET /memory/{worker_id} (verified against api/memory.py before building
 * this route; see MEMORY_IMPLEMENTATION_REPORT.md §2). This page fetches
 * that worker's full memory list (already ownership-checked server-side)
 * and finds the one matching memoryId, the same "derive detail from an
 * existing per-item endpoint" technique Package 5's chat session detail page
 * and Package 4's knowledge/worker reverse lookup both used.
 */
export default async function MemoryDetailPage({ params }) {
  const { workerId, memoryId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Memory</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this memory.</p>
          </div>
        </section>
      </main>
    );
  }

  const [summaryResult, memoriesResult] = await Promise.allSettled([
    fetchWorkerSummary(token, workerId),
    fetchWorkerMemories(token, workerId),
  ]);

  const summary = settle(summaryResult);
  const memories = settle(memoriesResult);

  if (memories.error) {
    const notFound = memories.error instanceof ApiError && [403, 404].includes(memories.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Memory</span>
            <h1>{notFound ? 'Worker not found.' : 'Unable to load this memory.'}</h1>
            <p className="lead">
              {notFound
                ? "This worker doesn't exist, or belongs to a different organisation."
                : 'Something went wrong loading this memory.'}
            </p>
            <Link className="btn btn-secondary" href="/portal/memory">
              Back to Memory
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const memory = memories.value.find((item) => item.id === memoryId);

  if (!memory) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Memory</span>
            <h1>Memory not found.</h1>
            <p className="lead">This memory doesn&apos;t exist, or has already been recreated with a new id.</p>
            <Link className="btn btn-secondary" href={`/portal/memory/${workerId}`}>
              Back to Worker Memory
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const workerName = summary.error ? null : summary.value.worker.name;

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Memory</span>
            <h1>{workerName ? `Memory for ${workerName}` : 'Memory detail'}</h1>
            <p className="lead">
              <span className="badge">{memory.memory_type}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="document-content">{memory.memory_content}</div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <p className="form-note-banner" role="note">
            Memories can&apos;t be edited or deleted from this app — only created and read.
          </p>
          <Link className="btn btn-secondary" href={`/portal/memory/${workerId}`}>
            Back to Worker Memory
          </Link>
        </div>
      </section>
    </main>
  );
}
