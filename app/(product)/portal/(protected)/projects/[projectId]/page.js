import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchProjects } from '@/lib/api/projects';
import { fetchTasks } from '@/lib/api/tasks';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchWorkerPools } from '@/lib/api/workerPools';
import { settle, errorMessage } from '@/lib/api/results';
import TaskPanel from '@/components/portal/TaskPanel';
import ProjectStatusControl from '@/components/portal/ProjectStatusControl';
import WorkforceNav from '@/components/portal/WorkforceNav';

export const metadata = {
  title: 'Project | Teracom AI Portal',
};

/**
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- the bookmarkable, deep-linkable
 * single-project view UX_REVIEW_CUSTOMER_PLATFORM_V1.md §H2 found
 * missing entirely. No dedicated GET /projects/{id} backend endpoint
 * exists (only GET /projects/{id}/status), so — same fan-out precedent
 * the Tasks page (app/portal/(protected)/tasks/page.js) already uses for
 * "every task across every project" — this fetches the organisation's
 * full project and task lists once and finds the one project client-side,
 * rather than adding a new backend endpoint for what one filter already
 * answers.
 */
export default async function ProjectDetailPage({ params }) {
  const { projectId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Project</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this project.</p>
          </div>
        </section>
      </main>
    );
  }

  const [projectsSettled, tasksSettled, workersSettled, workerPoolsSettled] = await Promise.allSettled([
    fetchProjects(token),
    fetchTasks(token, projectId),
    fetchWorkerList(token),
    fetchWorkerPools(token),
  ]);

  const projectsResult = settle(projectsSettled);
  const tasksResult = settle(tasksSettled);
  const workersResult = settle(workersSettled);
  const workerPoolsResult = settle(workerPoolsSettled);

  if (projectsResult.error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Project</span>
            <p className="form-error" role="alert">
              {errorMessage(projectsResult.error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const project = (projectsResult.value ?? []).find((item) => item.id === projectId);

  if (!project) {
    return (
      <>
        <WorkforceNav />
        <main>
          <section className="section">
            <div className="container">
              <span className="eyebrow">Project</span>
              <h1>Project not found.</h1>
              <p className="lead">
                It may belong to a different organisation, or may not exist. See{' '}
                <Link href="/portal/projects">all Projects</Link>.
              </p>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <WorkforceNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">
                Project · <Link href="/portal/projects">All Projects</Link>
              </span>
              <h1>{project.name}</h1>
              {project.description && <p className="lead">{project.description}</p>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div style={{ marginBottom: '1.5rem' }}>
              <ProjectStatusControl projectId={project.id} status={project.status} />
            </div>

            <div className="section-heading left">
              <span className="eyebrow">Tasks</span>
              <h2>Every task in this project.</h2>
            </div>

            {tasksResult.error || workersResult.error ? (
              <p className="form-error" role="alert">
                {errorMessage(tasksResult.error ?? workersResult.error)}
              </p>
            ) : (
              <TaskPanel
                projectId={project.id}
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
