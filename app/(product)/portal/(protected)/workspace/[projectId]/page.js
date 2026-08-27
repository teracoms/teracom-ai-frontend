import Link from 'next/link';

import { getSessionToken, getSessionUser } from '@/lib/api/auth';
import { fetchProjects } from '@/lib/api/projects';
import { fetchTasks, fetchTaskExecutions } from '@/lib/api/tasks';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchWorkerPools } from '@/lib/api/workerPools';
import { fetchUploadHistory } from '@/lib/api/knowledge';
import { fetchProjectConversation } from '@/lib/api/orchestrator';
import { fetchProjectOutputs, fetchStorageUsage } from '@/lib/api/outputArtifacts';
import { fetchLatestRequirements } from '@/lib/api/requirements';
import { fetchUserSettings } from '@/lib/api/userSettings';
import { isAtLeastRole } from '@/lib/roles';
import { settle, errorMessage } from '@/lib/api/results';
import { pickDefaultWorker } from '@/lib/portalInitiative';
import ProjectWorkspaceTabs from '@/components/portal/ProjectWorkspaceTabs';
import WorkforceNav from '@/components/portal/WorkforceNav';

export const metadata = {
  title: 'Project Workspace | Teracom AI Portal',
};

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- Project Workspace (objective item 3):
// reuses exactly the existing project/task/knowledge backend the prior
// /portal/projects/[projectId] page already used -- no new backend
// endpoint, no new data. Conversation is the default tab (item 4,
// "conversation-first").
//
// CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec7 -- of the original five tabs, only
// Conversation (now with Requirements folded in, Sec5) and Outputs remain
// customer-facing. Files and Activity (the former TaskPanel/
// ProjectStatusControl tab) are preserved in full, not removed -- see
// ProjectWorkspaceTabs.js's own docstring -- but only render at all when
// `administrationMode` is true, computed below the same way PortalNav
// computes it: admin-tier role AND the stored preference set to
// "administration".
//
// Same fan-out precedent that page already used: no dedicated
// GET /projects/{id} endpoint exists, so the organisation's full project
// list is fetched once and the one project found client-side, same as
// before.
export default async function ProjectWorkspacePage({ params }) {
  const { projectId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Project Workspace</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this project.</p>
          </div>
        </section>
      </main>
    );
  }

  const user = await getSessionUser();

  const [
    projectsSettled,
    tasksSettled,
    workersSettled,
    workerPoolsSettled,
    uploadsSettled,
    conversationSettled,
    outputsSettled,
    storageUsageSettled,
    requirementSettled,
  ] = await Promise.allSettled([
    fetchProjects(token),
    fetchTasks(token, projectId),
    fetchWorkerList(token),
    fetchWorkerPools(token),
    fetchUploadHistory(token),
    fetchProjectConversation(token, projectId),
    fetchProjectOutputs(token, projectId),
    fetchStorageUsage(token),
    fetchLatestRequirements(token, projectId),
  ]);

  const projectsResult = settle(projectsSettled);
  const tasksResult = settle(tasksSettled);
  const workersResult = settle(workersSettled);
  const workerPoolsResult = settle(workerPoolsSettled);
  const uploadsResult = settle(uploadsSettled);
  const conversationResult = settle(conversationSettled);
  const outputsResult = settle(outputsSettled);
  const storageUsageResult = settle(storageUsageSettled);
  const requirementResult = settle(requirementSettled);

  if (projectsResult.error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Project Workspace</span>
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
              <span className="eyebrow">Project Workspace</span>
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

  const tasks = tasksResult.value ?? [];
  const workers = (workersResult.value ?? []).filter((worker) => worker.status === 'active');
  const workerPools = workerPoolsResult.value ?? [];
  const uploads = uploadsResult.value ?? [];

  // Conversation tab worker: the worker assigned to this project's most
  // recently created task (real, if the Initiative flow or manual task
  // assignment set one), falling back to the same default-worker heuristic
  // the Initiative flow itself uses when the project has no assigned
  // worker yet. Project itself carries no worker_id of its own -- there is
  // no such field on the Project model.
  const mostRecentAssignedTask = [...tasks]
    .filter((task) => task.assignee_worker_id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const assignedWorker = mostRecentAssignedTask
    ? workers.find((worker) => worker.id === mostRecentAssignedTask.assignee_worker_id)
    : null;
  const conversationWorker = assignedWorker ?? pickDefaultWorker(workers, project.description ?? project.name);

  // Outputs tab: real execution records (steps + verification_result) for
  // this project's completed tasks -- GET /tasks/{id}/executions, capped
  // at the 10 most recently completed tasks to bound the fan-out.
  const completedTasks = tasks
    .filter((task) => task.status === 'done')
    .sort((a, b) => new Date(b.completed_at ?? b.created_at) - new Date(a.completed_at ?? a.created_at))
    .slice(0, 10);

  const executionSettled = await Promise.allSettled(
    completedTasks.map((task) => fetchTaskExecutions(token, task.id))
  );
  const taskExecutions = completedTasks.map((task, index) => ({
    task,
    executions: settle(executionSettled[index]).value ?? [],
  }));

  // CUSTOMER_EXPERIENCE_REDESIGN_V3 Sec3/Sec7 -- same admin-tier +
  // preference gate PortalNav itself already applies (never trust a
  // stored preference alone: a non-admin always gets Customer Mode,
  // recomputed fresh on every render). Best-effort settings fetch, same
  // posture as the layout's own -- a failure here just means Files/
  // Activity stay out of reach for this one page load, not that the
  // whole workspace fails to render.
  let navigationMode = 'customer';
  try {
    const settings = await fetchUserSettings(token);
    if (settings?.preferences?.navigation?.mode) {
      navigationMode = settings.preferences.navigation.mode;
    }
  } catch {
    navigationMode = 'customer';
  }
  const administrationMode = isAtLeastRole(user?.role, 'admin') && navigationMode === 'administration';

  return (
    <>
      <WorkforceNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">
                Project Workspace · <Link href="/portal/projects">All Projects</Link>
              </span>
              <h1>{project.name}</h1>
              {project.description && <p className="lead">{project.description}</p>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <ProjectWorkspaceTabs
              project={project}
              conversationWorker={conversationWorker}
              conversationMessages={conversationResult.value?.messages ?? []}
              requirement={requirementResult.value ?? null}
              uploads={uploads}
              outputs={outputsResult.value ?? []}
              storageUsage={storageUsageResult.value ?? null}
              taskExecutions={taskExecutions}
              tasks={tasks}
              workers={workers}
              workerPools={workerPools}
              administrationMode={administrationMode}
              loadErrors={{
                tasks: tasksResult.error ? errorMessage(tasksResult.error) : null,
                workers: workersResult.error ? errorMessage(workersResult.error) : null,
                uploads: uploadsResult.error ? errorMessage(uploadsResult.error) : null,
              }}
            />
          </div>
        </section>
      </main>
    </>
  );
}
