import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchDepartment, fetchDepartments, fetchDepartmentWorkers } from '@/lib/api/departments';
import { fetchDepartmentHeadConsultations } from '@/lib/api/departmentHeads';
import { fetchPipelineSummary } from '@/lib/api/crm';
import { fetchMarketingSummary } from '@/lib/api/marketing';
import { settle, errorMessage } from '@/lib/api/results';
import DepartmentDashboard from '@/components/portal/DepartmentDashboard';

export const metadata = {
  title: 'Department Dashboard | Teracom AI Portal',
};

/**
 * The Department Head dashboard (Phase 0 Package I, objective #3):
 * department identity, its current head, its own workers
 * (GET /departments/{id}/workers, Package I), a link into Package H's
 * existing department memory view (unchanged), and — when this
 * department has a head — direct communication with any other
 * department's head (DepartmentHeadConsultationPanel).
 */
export default async function DepartmentDashboardPage({ params }) {
  const { departmentId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Department</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this department.</p>
          </div>
        </section>
      </main>
    );
  }

  const [departmentResult, workersResult, allDepartmentsResult, consultationsResult, pipelineSummaryResult, marketingSummaryResult] =
    await Promise.allSettled([
      fetchDepartment(token, departmentId),
      fetchDepartmentWorkers(token, departmentId),
      fetchDepartments(token),
      fetchDepartmentHeadConsultations(token),
      fetchPipelineSummary(token),
      fetchMarketingSummary(token),
    ]);

  const department = settle(departmentResult);

  if (department.error) {
    const notFound = department.error instanceof ApiError && [403, 404].includes(department.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Department</span>
            <h1>{notFound ? 'Department not found.' : 'Unable to load this department.'}</h1>
            <p className="lead">
              {notFound
                ? "This department doesn't exist, or belongs to a different organisation."
                : errorMessage(department.error)}
            </p>
            <Link className="btn btn-secondary" href="/portal/departments">
              Back to Departments
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const workers = settle(workersResult);
  const allDepartments = settle(allDepartmentsResult);
  const consultations = settle(consultationsResult);
  const pipelineSummary = settle(pipelineSummaryResult);
  const marketingSummary = settle(marketingSummaryResult);

  const head = department.value.head_worker_id
    ? (workers.value ?? []).find((worker) => worker.id === department.value.head_worker_id)
    : null;

  // Every other department's current head — the picker for direct
  // department-head-to-department-head communication (objective #4).
  const otherHeads = (allDepartments.value ?? [])
    .filter((other) => other.id !== departmentId && other.head_worker_id)
    .map((other) => ({ departmentId: other.id, departmentName: other.name, workerId: other.head_worker_id }));

  const relevantConsultations = (consultations.value ?? []).filter(
    (consultation) =>
      head && (consultation.primary_worker_id === head.id || consultation.consulted_worker_id === head.id)
  );

  return (
    <DepartmentDashboard
      department={department.value}
      head={head}
      workers={workers.value ?? []}
      workersError={workers.error}
      otherHeads={otherHeads}
      headWorkerId={head?.id ?? null}
      consultations={relevantConsultations}
      pipelineSummary={pipelineSummary.value}
      pipelineSummaryError={pipelineSummary.error}
      marketingSummary={marketingSummary.value}
      marketingSummaryError={marketingSummary.error}
    />
  );
}
