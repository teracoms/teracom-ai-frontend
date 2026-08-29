import { getSessionToken } from '@/lib/api/auth';
import { fetchTasks } from '@/lib/api/tasks';
import { fetchProjects } from '@/lib/api/projects';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchWorkerPools } from '@/lib/api/workerPools';
import { settle, errorMessage } from '@/lib/api/results';
import EmptyState from '@/components/portal/EmptyState';
import TaskStatusControl from '@/components/portal/TaskStatusControl';
import TaskCreateForm from '@/components/portal/TaskCreateForm';
import WorkforceNav from '@/components/portal/WorkforceNav';
import ConceptHelp from '@/components/portal/ConceptHelp';

export const metadata = {
  title: 'Tasks | Teracom AI Portal',
};

/**
 * A standalone, cross-project Tasks surface — previously Task rows
 * were only ever visible embedded inside a single Project's own
 * ProjectPanel (components/portal/TaskPanel.js), with no page
 * showing a member's or the organisation's own tasks across every
 * project at once. Creation is now possible here too via
 * TaskCreateForm's own project selector (POST /tasks/ already
 * required no changes — it was always generic on project_id).
 */
export default async function TasksPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Tasks</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view tasks.</p>
          </div>
        </section>
      </main>
    );
  }

  const [tasksResult, projectsResult, workersResult, workerPoolsResult] = await Promise.allSettled([
    fetchTasks(token),
    fetchProjects(token),
    fetchWorkerList(token),
    fetchWorkerPools(token),
  ]);

  const tasks = settle(tasksResult);
  const projects = settle(projectsResult);
  const workers = settle(workersResult);
  const workerPools = settle(workerPoolsResult);

  const projectsById = new Map((projects.value ?? []).map((project) => [project.id, project]));
  const workersById = new Map((workers.value ?? []).map((worker) => [worker.id, worker]));
  const poolsById = new Map((workerPools.value ?? []).map((pool) => [pool.id, pool]));

  const sortedTasks = [...(tasks.value ?? [])].sort((a, b) => {
    if (a.status === b.status) return 0;
    const order = { pending: 0, in_progress: 1, done: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <>
      <WorkforceNav />
      <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Tasks</span>
            <h1>
              Every task, across every project.
              <ConceptHelp concept="task" />
            </h1>
            <p className="lead">
              Work assigned to a human or to a Worker — pending, in progress, and done — in one
              place.
            </p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">New</span>
            <h2>Add a task.</h2>
          </div>
          <TaskCreateForm
            projects={projects.value ?? []}
            workers={(workers.value ?? []).filter((worker) => worker.status === 'active')}
            workerPools={workerPools.value ?? []}
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          {tasks.error ? (
            <p className="form-error" role="alert">
              {errorMessage(tasks.error)}
            </p>
          ) : sortedTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Create a project, then add its first task from that project's own page."
            />
          ) : (
            <ul className="activity-list">
              {sortedTasks.map((task) => {
                const project = projectsById.get(task.project_id);
                const assignee = task.assignee_worker_id ? workersById.get(task.assignee_worker_id) : null;
                const pool = !assignee && task.assignee_worker_pool_id ? poolsById.get(task.assignee_worker_pool_id) : null;
                return (
                  <li key={task.id}>
                    <div className="assignment-row">
                      <div>
                        <p className="activity-title">{task.title}</p>
                        <p className="activity-meta">
                          {project ? project.name : 'Unknown project'}
                          {assignee
                            ? ` · Assigned to ${assignee.name}`
                            : pool
                              ? ` · Routed to ${pool.name} (not yet assigned)`
                              : ''}
                          {task.priority ? ` · Priority: ${task.priority}` : ''}
                          {task.due_date ? ` · Due ${task.due_date}` : ''}
                        </p>
                      </div>
                      <TaskStatusControl
                        taskId={task.id}
                        status={task.status}
                        assigneeWorkerId={task.assignee_worker_id}
                        assigneeWorkerPoolId={task.assignee_worker_pool_id}
                      />

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
