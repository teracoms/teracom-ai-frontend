import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchDepartments } from '@/lib/api/departments';
import { fetchWorkerList } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import EmptyState from '@/components/portal/EmptyState';
import WorkforceNav from '@/components/portal/WorkforceNav';

export const metadata = {
  title: 'Departments | Teracom AI Portal',
};

/**
 * Phase 0 Package I (Department Head Layer & Executive Organisation) —
 * the first non-admin-gated, non-memory-specific department surface (Package
 * H's department screens are either admin-only management or memory-only
 * views). Any org member may browse the department structure and its
 * current heads, then open a department's own dashboard.
 */
export default async function DepartmentsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Departments</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view departments.</p>
          </div>
        </section>
      </main>
    );
  }

  const canManage = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');

  const [departmentsResult, workersResult] = await Promise.allSettled([
    fetchDepartments(token),
    fetchWorkerList(token),
  ]);

  const departments = settle(departmentsResult);
  const workers = settle(workersResult);

  const workersById = new Map((workers.value ?? []).map((worker) => [worker.id, worker]));

  return (
    <>
      <WorkforceNav />
      <main>
      <section className="hero hero-product hero-workforce">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Departments</span>
            <h1>Your organisation&apos;s executive structure.</h1>
            <p className="lead">
              Every department, its current head (when assigned), and its own workers — the
              layer between Organisation and Worker in Human → Orchestrator → Department Heads →
              Workers.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {canManage && (
            <p style={{ marginBottom: '1rem' }}>
              <Link className="btn btn-secondary btn-small" href="/portal/admin/departments">
                Manage Departments
              </Link>
            </p>
          )}
          {departments.error ? (
            <p className="form-error" role="alert">
              {errorMessage(departments.error)}
            </p>
          ) : departments.value.length === 0 ? (
            <EmptyState
              title="No departments yet"
              description={
                canManage
                  ? 'Create your first department to get started.'
                  : 'An organisation admin creates departments from Admin → Departments.'
              }
            />
          ) : (
            <ul className="activity-list">
              {departments.value.map((department) => {
                const head = department.head_worker_id ? workersById.get(department.head_worker_id) : null;
                return (
                  <li key={department.id}>
                    <div className="assignment-row">
                      <div>
                        <p className="activity-title">{department.name}</p>
                        <p className="activity-meta">
                          {head ? `Head: ${head.name}` : 'No head assigned yet'}
                        </p>
                        {department.description && <p className="activity-meta">{department.description}</p>}
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
    </main>
    </>
  );
}
