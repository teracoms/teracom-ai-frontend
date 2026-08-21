import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchDepartments } from '@/lib/api/departments';
import { fetchWorkerList } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import CreateDepartmentForm from '@/components/portal/CreateDepartmentForm';
import DepartmentListView from '@/components/portal/DepartmentListView';

export const metadata = {
  title: 'Departments | Teracom AI Portal',
};

/**
 * Phase 0 Package H (Knowledge & Memory Intelligence) — admin-managed
 * department structure, the "Department Heads" layer between Organisation
 * and Worker. Lives under /portal/admin, whose layout already role-gates
 * this whole tree, but this page also checks the role itself before
 * fetching anything — the same belt-and-braces precedent Package 9's
 * billing pages established (a parent layout rendering a restricted
 * message instead of `{children}` does not stop a child page.js's own
 * Server Component from still executing its data fetches — see
 * BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §9).
 */
export default async function AdminDepartmentsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Departments</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to manage departments.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAtLeastRole(decodeJwtPayload(token)?.role, 'admin')) {
    return null;
  }

  const [departmentsResult, workersResult] = await Promise.allSettled([
    fetchDepartments(token),
    fetchWorkerList(token),
  ]);

  const departments = settle(departmentsResult);
  const workers = settle(workersResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Departments</span>
            <h1>Organise your workforce.</h1>
            <p className="lead">
              Group workers into departments to unlock department-level memory, one tier above
              per-worker memory and below organisation-wide memory.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Create</span>
            <h2>Create a department.</h2>
          </div>
          <CreateDepartmentForm />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {departments.error || workers.error ? (
            <p className="form-error" role="alert">
              {errorMessage(departments.error || workers.error)}
            </p>
          ) : (
            <DepartmentListView departments={departments.value ?? []} workers={workers.value ?? []} />
          )}
        </div>
      </section>
    </main>
  );
}
