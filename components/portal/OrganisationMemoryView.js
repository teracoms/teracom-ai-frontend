import EmptyState from '@/components/portal/EmptyState';

/**
 * Read-only list, presentational only (no edit/delete — same standing
 * limitation as WorkerMemory, see MEMORY_IMPLEMENTATION_REPORT.md §2,
 * unchanged by this package).
 */
export default function OrganisationMemoryView({ memories }) {
  if (memories.length === 0) {
    return (
      <EmptyState
        title="No organisation-wide memories yet"
        description="Add one above — this tier is visible to admins only, across every department and worker."
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
