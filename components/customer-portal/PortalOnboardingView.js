// Objective #6 — read-only onboarding checklist visibility.
export default function PortalOnboardingView({ tasks }) {
  if (tasks.length === 0) {
    return <p className="activity-meta">No onboarding tasks yet.</p>;
  }

  return (
    <ul className="activity-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <p className="activity-title">
            {task.title} <span className="badge">{task.status}</span>
          </p>
          {task.description && <p className="activity-meta">{task.description}</p>}
        </li>
      ))}
    </ul>
  );
}
