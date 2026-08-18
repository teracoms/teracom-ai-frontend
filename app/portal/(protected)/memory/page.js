import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { fetchWorkerList, fetchWorkerMemories } from '@/lib/api/workers';
import { fetchMemorySummary } from '@/lib/api/memory';
import { fetchDepartments } from '@/lib/api/departments';
import { settle, errorMessage } from '@/lib/api/results';
import StatTile from '@/components/portal/StatTile';
import MemoryOverviewView from '@/components/portal/MemoryOverviewView';
import EmptyState from '@/components/portal/EmptyState';

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

  const isAdmin = decodeJwtPayload(token)?.role === 'admin';

  const [summaryResult, workersResult, departmentsResult] = await Promise.allSettled([
    fetchMemorySummary(token),
    fetchWorkerList(token),
    fetchDepartments(token),
  ]);

  const summary = settle(summaryResult);
  const workersList = settle(workersResult);
  const departments = settle(departmentsResult);

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

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Memory Hierarchy</span>
            <h2>Departments and organisation memory.</h2>
            <p>
              Phase 0 Package H adds two tiers above per-worker memory: department memory (any
              organisation member can view; an admin can add) and organisation memory
              (admin-only). Both feed into Orchestration&apos;s executive synthesis.
            </p>
          </div>

          {isAdmin && (
            <p>
              <Link className="btn btn-secondary btn-small" href="/portal/memory/organisation">
                View Organisation Memory
              </Link>{' '}
              <Link className="btn btn-secondary btn-small" href="/portal/admin/departments">
                Manage Departments
              </Link>
            </p>
          )}

          {departments.error ? (
            <p className="form-error" role="alert">
              {errorMessage(departments.error)}
            </p>
          ) : (departments.value ?? []).length === 0 ? (
            <EmptyState
              title="No departments yet"
              description={
                isAdmin
                  ? 'Create one from Manage Departments above to unlock department-level memory.'
                  : 'An organisation admin has not created any departments yet.'
              }
            />
          ) : (
            <ul className="activity-list">
              {departments.value.map((department) => (
                <li key={department.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">{department.name}</p>
                      {department.description && <p className="activity-meta">{department.description}</p>}
                    </div>
                    <Link
                      className="btn btn-secondary btn-small"
                      href={`/portal/memory/department/${department.id}`}
                    >
                      View Memory
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
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
