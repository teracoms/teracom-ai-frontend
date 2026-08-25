import EmptyState from '@/components/portal/EmptyState';
import MemoryArchiveControl from '@/components/portal/MemoryArchiveControl';

/**
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes UX_REVIEW_CUSTOMER_PLATFORM_V1.md
 * §H4: was read-only/presentational-only ("no edit/delete"). An admin can
 * now archive a memory that's incorrect or no longer relevant directly from
 * this list -- still no true edit, by the same deliberate additive-only
 * design as every other memory tier.
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
          <div className="assignment-row">
            <div>
              <p className="activity-title">{memory.memory_content}</p>
              <p className="activity-meta">Type: {memory.memory_type}</p>
            </div>
            <MemoryArchiveControl
              archiveUrl={`/api/portal/organisation-memory/${memory.id}/archive`}
              archived={memory.is_archived}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
