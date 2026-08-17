import { getSessionToken } from '@/lib/api/auth';
import { fetchOperationsSummary } from '@/lib/api/operations';
import { fetchProjects } from '@/lib/api/projects';
import { fetchTasks } from '@/lib/api/tasks';
import { fetchDepartments } from '@/lib/api/departments';
import { settle, errorMessage } from '@/lib/api/results';
import OperationsSummaryWidget from '@/components/portal/OperationsSummaryWidget';
import ProjectPanel from '@/components/portal/ProjectPanel';

export const metadata = {
  title: 'Operations | Teracom AI Portal',
};

/**
 * The Operations & Project Delivery workspace (Phase 0 Package N):
 * Operations Manager Worker / retrofitted Project Manager Worker's
 * shared home — org-wide project/task delivery tracking and
 * organisation-wide operational visibility.
 */
export default async function OperationsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Operations</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the Operations workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  // Per-section resilience (ADR-008): the summary, project list, task
  // list, and department list are independent of each other.
  const [summarySettled, projectsSettled, tasksSettled, departmentsSettled] = await Promise.allSettled([
    fetchOperationsSummary(token),
    fetchProjects(token),
    fetchTasks(token),
    fetchDepartments(token),
  ]);

  const summaryResult = settle(summarySettled);
  const projectsResult = settle(projectsSettled);
  const tasksResult = settle(tasksSettled);
  const departmentsResult = settle(departmentsSettled);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Operations</span>
            <h1>Projects &amp; task delivery.</h1>
            <p className="lead">
              The Operations workspace — track projects and their tasks across your organisation,
              optionally scoped to a department.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {summaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summaryResult.error)}
            </p>
          ) : (
            <OperationsSummaryWidget summary={summaryResult.value} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {projectsResult.error || tasksResult.error || departmentsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(projectsResult.error ?? tasksResult.error ?? departmentsResult.error)}
            </p>
          ) : (
            <ProjectPanel
              departments={departmentsResult.value ?? []}
              projects={projectsResult.value ?? []}
              tasks={tasksResult.value ?? []}
            />
          )}
        </div>
      </section>
    </main>
  );
}
