import { getSessionToken } from '@/lib/api/auth';
import { fetchProjects } from '@/lib/api/projects';
import { fetchTasks } from '@/lib/api/tasks';
import { fetchDepartments } from '@/lib/api/departments';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchWorkerPools } from '@/lib/api/workerPools';
import { settle, errorMessage } from '@/lib/api/results';
import ProjectPanel from '@/components/portal/ProjectPanel';
import WorkforceNav from '@/components/portal/WorkforceNav';

export const metadata = {
  title: 'Projects | Teracom AI Portal',
};

/**
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
 * §H2: Projects previously had no top-level nav entry and no route of its
 * own at all, existing only as a component embedded inside
 * /portal/operations. This page gives Projects a first-class, dedicated,
 * bookmarkable home, reusing ProjectPanel and the exact same org-wide data
 * fetch app/portal/(protected)/operations/page.js already performs -- no
 * new backend endpoint, no new data. /portal/operations keeps its own
 * operational summary widget and now links here instead of duplicating
 * this same project-management UI inline (§M1/duplicate-navigation
 * cleanup).
 */
export default async function ProjectsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Projects</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view projects.</p>
          </div>
        </section>
      </main>
    );
  }

  const [projectsSettled, tasksSettled, departmentsSettled, workersSettled, workerPoolsSettled] =
    await Promise.allSettled([
      fetchProjects(token),
      fetchTasks(token),
      fetchDepartments(token),
      fetchWorkerList(token),
      fetchWorkerPools(token),
    ]);

  const projectsResult = settle(projectsSettled);
  const tasksResult = settle(tasksSettled);
  const departmentsResult = settle(departmentsSettled);
  const workersResult = settle(workersSettled);
  const workerPoolsResult = settle(workerPoolsSettled);

  return (
    <>
      <WorkforceNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Projects</span>
              <h1>Every project, across your organisation.</h1>
              <p className="lead">
                Create a project, track its tasks, or ask a Worker to plan one from a goal. See{' '}
                <a href="/portal/operations">Operations</a> for organisation-wide delivery
                statistics.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
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
                workers={(workersResult.value ?? []).filter((worker) => worker.status === 'active')}
                workerPools={workerPoolsResult.value ?? []}
              />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
