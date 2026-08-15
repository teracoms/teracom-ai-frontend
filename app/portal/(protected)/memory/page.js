import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList, fetchWorkerMemories } from '@/lib/api/workers';
import { fetchMemorySummary } from '@/lib/api/memory';
import { settle, errorMessage } from '@/lib/api/results';
import StatTile from '@/components/portal/StatTile';
import MemoryOverviewView from '@/components/portal/MemoryOverviewView';

export const metadata = {
  title: 'Memory | Teracom AI Portal',
};

export default async function MemoryPage() {
  const token = getSessionToken();

  // Defensive only: app/portal/(protected)/layout.js already guarantees a
  // valid session before this page renders — same precedent as every prior
  // package's entry page.
  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Memory</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view worker memory.</p>
          </div>
        </section>
      </main>
    );
  }

  const [summaryResult, workersResult] = await Promise.allSettled([
    fetchMemorySummary(token),
    fetchWorkerList(token),
  ]);

  const summary = settle(summaryResult);
  const workersList = settle(workersResult);

  // There is no "all memories for my organisation" endpoint (§C.10) — this
  // fans out one GET /memory/{worker_id} call per worker, the same bounded,
  // per-item-endpoint technique Package 4 used to compute Knowledge's
  // reverse worker-assignment lookup. A single worker's fetch failing
  // doesn't take down the others; it's just dropped from the browser with
  // its own logged reason (via .catch below), same resilience posture as
  // every other per-item fan-out in this app.
  let groups = [];
  let groupsError = null;

  if (workersList.error) {
    groupsError = workersList.error;
  } else {
    const perWorkerMemories = await Promise.all(
      workersList.value.map((worker) =>
        fetchWorkerMemories(token, worker.id)
          .then((memories) => ({ worker, memories, error: null }))
          .catch((error) => ({ worker, memories: [], error }))
      )
    );

    groups = perWorkerMemories
      .filter((entry) => entry.memories.length > 0)
      .map((entry) => ({
        workerId: entry.worker.id,
        workerName: entry.worker.name,
        workerRole: entry.worker.role,
        memories: entry.memories,
      }));
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Memory</span>
            <h1>What your workers remember.</h1>
            <p className="lead">
              Facts captured automatically during chat, or added manually, grouped by the worker
              they belong to.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {summary.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summary.error)}
            </p>
          ) : (
            <StatTile label="Total Memories" value={summary.value.total_memories} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Browse</span>
            <h2>Memories by worker.</h2>
          </div>
          {groupsError ? (
            <p className="form-error" role="alert">
              {errorMessage(groupsError)}
            </p>
          ) : (
            <MemoryOverviewView groups={groups} />
          )}
        </div>
      </section>
    </main>
  );
}
