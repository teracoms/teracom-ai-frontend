import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchDepartments } from '@/lib/api/departments';
import { fetchWorkerCreationRequests } from '@/lib/api/workerCreationRequests';
import { settle, errorMessage } from '@/lib/api/results';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Digital Workforce | Teracom AI Portal',
};

/**
 * The one previously-missing "whole workforce at a glance" surface — every
 * other workforce screen is scoped to a single thing you already know about
 * (a worker, a department, one governance request): /portal/workers is a
 * flat searchable list, /portal/departments browses department-by-department,
 * /portal/workers/requests is the decision queue itself. Nothing composed
 * headcount, structure, and the pending governance queue into one view. This
 * page adds no new backend data — fetchWorkerList/fetchDepartments/
 * fetchWorkerCreationRequests all already existed; it only aggregates them.
 */
export default async function DigitalWorkforcePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Digital Workforce</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your digital workforce.</p>
          </div>
        </section>
      </main>
    );
  }

  const [workersResult, departmentsResult, requestsResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchDepartments(token),
    fetchWorkerCreationRequests(token),
  ]);

  const workers = settle(workersResult);
  const departments = settle(departmentsResult);
  const requests = settle(requestsResult);

  if (workers.error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="form-error" role="alert">
              {errorMessage(workers.error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const workerList = workers.value ?? [];
  const departmentList = departments.value ?? [];
  const pendingRequests = (requests.value ?? []).filter((request) => request.status === 'submitted');

  const workersById = new Map(workerList.map((worker) => [worker.id, worker]));
  const activeCount = workerList.filter((worker) => worker.status === 'active').length;
  const inactiveCount = workerList.length - activeCount;

  const workersByDepartment = new Map();
  const unassigned = [];
  for (const worker of workerList) {
    if (worker.department_id) {
      const bucket = workersByDepartment.get(worker.department_id) ?? [];
      bucket.push(worker);
      workersByDepartment.set(worker.department_id, bucket);
    } else {
      unassigned.push(worker);
    }
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Digital Workforce</span>
            <h1>Your entire AI workforce, at a glance.</h1>
            <p className="lead">
              Headcount, department structure, and any worker proposal still waiting on a
              decision — one view instead of three.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stat-grid">
          <div className="stat-tile">
            <p className="activity-meta">Total workers</p>
            <p className="activity-title">{workerList.length}</p>
          </div>
          <div className="stat-tile">
            <p className="activity-meta">Active / Inactive</p>
            <p className="activity-title">
              {activeCount} / {inactiveCount}
            </p>
          </div>
          <div className="stat-tile">
            <p className="activity-meta">Departments</p>
            <p className="activity-title">{departmentList.length}</p>
          </div>
          <div className="stat-tile">
            <p className="activity-meta">Pending worker requests</p>
            <p className="activity-title">
              {requests.error ? '—' : pendingRequests.length}
            </p>
            {pendingRequests.length > 0 && (
              <Link className="btn btn-secondary btn-small" href="/portal/workers/requests">
                Review queue
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Structure</span>
            <h2>Every department and who&apos;s in it.</h2>
          </div>

          {departmentList.length === 0 ? (
            <EmptyState
              title="No departments yet"
              description="An organisation admin creates departments from Admin → Departments."
            />
          ) : (
            <ul className="activity-list">
              {departmentList.map((department) => {
                const head = department.head_worker_id ? workersById.get(department.head_worker_id) : null;
                const members = workersByDepartment.get(department.id) ?? [];
                return (
                  <li key={department.id}>
                    <div className="assignment-row">
                      <div>
                        <p className="activity-title">
                          {department.name}
                          {department.function ? ` · ${department.function.replace('_', ' ')}` : ''}
                        </p>
                        <p className="activity-meta">
                          {head ? `Head: ${head.name}` : 'No head assigned yet'} · {members.length}{' '}
                          {members.length === 1 ? 'worker' : 'workers'}
                        </p>
                        {members.length > 0 && (
                          <p className="activity-meta">
                            {members.map((member) => member.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <Link className="btn btn-secondary btn-small" href={`/portal/departments/${department.id}`}>
                        Open Dashboard
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {unassigned.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Unassigned</span>
              <h2>Workers with no department yet.</h2>
              <p>
                Assign a department from a worker&apos;s own page (
                <Link href="/portal/workers">Workers</Link>) to bring them into a department&apos;s
                reporting line.
              </p>
            </div>
            <ul className="activity-list">
              {unassigned.map((worker) => (
                <li key={worker.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">{worker.name}</p>
                      <p className="activity-meta">
                        {worker.role} · {worker.status}
                      </p>
                    </div>
                    <Link className="btn btn-secondary btn-small" href={`/portal/workers/${worker.id}`}>
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
