// Objectives #2/#9 — read-only project visibility and progress tracking.
// Only Projects staff have explicitly linked to this contact are visible.
export default function PortalProjectsView({ projects }) {
  if (projects.length === 0) {
    return <p className="activity-meta">No projects yet.</p>;
  }

  return (
    <ul className="activity-list">
      {projects.map((project) => (
        <li key={project.id}>
          <p className="activity-title">
            {project.name} <span className="badge">{project.status}</span>
          </p>
          {project.description && <p className="activity-meta">{project.description}</p>}
          <p className="activity-meta">
            {project.task_progress.done} of {project.task_progress.total} tasks complete (
            {project.task_progress.percent}%)
          </p>
        </li>
      ))}
    </ul>
  );
}
