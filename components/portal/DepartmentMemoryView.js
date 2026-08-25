import EmptyState from '@/components/portal/EmptyState';
import MemoryArchiveControl from '@/components/portal/MemoryArchiveControl';

// CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
// §H4: an admin can now archive an incorrect or stale department memory
// directly from this list, the same pattern applied to the worker and
// organisation tiers.
export default function DepartmentMemoryView({ memories, departmentId }) {
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
          <div className="assignment-row">
            <div>
              <p className="activity-title">{memory.memory_content}</p>
              <p className="activity-meta">Type: {memory.memory_type}</p>
            </div>
            <MemoryArchiveControl
              archiveUrl={`/api/portal/department-memory/${memory.id}/archive`}
              body={{ department_id: departmentId }}
              archived={memory.is_archived}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
