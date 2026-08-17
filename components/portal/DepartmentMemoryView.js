import EmptyState from '@/components/portal/EmptyState';

export default function DepartmentMemoryView({ memories }) {
  if (memories.length === 0) {
    return (
      <EmptyState
        title="No department memories yet"
        description="Any organisation member can view this tier; only an admin can add to it."
      />
    );
  }

  return (
    <ul className="activity-list">
      {memories.map((memory) => (
        <li key={memory.id}>
          <p className="activity-title">{memory.memory_content}</p>
          <p className="activity-meta">Type: {memory.memory_type}</p>
        </li>
      ))}
    </ul>
  );
}
