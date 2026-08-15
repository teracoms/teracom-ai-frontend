import { getSessionToken } from '@/lib/api/auth';
import { fetchPermissions } from '@/lib/api/admin';
import { fetchWorkerList, fetchKnowledgeCatalogue } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import PermissionMatrix from '@/components/portal/PermissionMatrix';

export const metadata = {
  title: 'Permissions | Teracom AI Portal',
};

export default async function AdminPermissionsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Permissions</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view permissions.</p>
          </div>
        </section>
      </main>
    );
  }

  const [permissionsResult, workersResult, knowledgeResult] = await Promise.allSettled([
    fetchPermissions(token),
    fetchWorkerList(token),
    fetchKnowledgeCatalogue(token),
  ]);

  const permissions = settle(permissionsResult);
  const workers = settle(workersResult);
  const knowledge = settle(knowledgeResult);

  const loadError = permissions.error || workers.error || knowledge.error;

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Permissions</span>
            <h1>Knowledge access matrix.</h1>
            <p className="lead">
              Every grant of a knowledge document to a worker across your organisation, in one
              place — the same relationship each worker&apos;s own Knowledge tab manages
              individually.
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
            <PermissionMatrix
              grants={enrichGrants(permissions.value, workers.value, knowledge.value)}
              workers={workers.value}
              knowledge={knowledge.value}
            />
          )}
        </div>
      </section>
    </main>
  );
}

/**
 * GET /permissions/ returns raw {id, knowledge_id, worker_id} rows with no
 * joined names (verified against api/permissions.py) — this cross-references
 * the already-fetched worker list and knowledge catalogue to build a
 * human-readable row. A grant whose worker or document can't be found (would
 * only happen if the underlying row were deleted without cleaning up its
 * permission, which the DB's foreign keys should prevent) is skipped rather
 * than shown with a confusing blank name.
 */
function enrichGrants(permissions, workers, knowledge) {
  const workerNames = new Map(workers.map((worker) => [worker.id, worker.name]));
  const knowledgeTitles = new Map(knowledge.map((item) => [item.id, item.title]));

  return permissions
    .filter((grant) => workerNames.has(grant.worker_id) && knowledgeTitles.has(grant.knowledge_id))
    .map((grant) => ({
      id: grant.id,
      workerId: grant.worker_id,
      workerName: workerNames.get(grant.worker_id),
      knowledgeId: grant.knowledge_id,
      knowledgeTitle: knowledgeTitles.get(grant.knowledge_id),
    }));
}
