import Link from 'next/link';

/**
 * Shared, presentational memory row — used by the overview page's
 * worker-grouped list and the per-worker memory page. `memory_type` is
 * rendered as a plain label, not a faceted filter: services/memory_service.py
 * always sets it to "fact" regardless of source (manual or auto-captured),
 * so the value never actually varies today (verified against source, not
 * assumed from the architecture doc).
 */
export default function MemoryListItem({ memory, workerId, truncate = true }) {
  const content =
    truncate && memory.memory_content.length > 160
      ? `${memory.memory_content.slice(0, 160).trim()}...`
      : memory.memory_content;

  return (
    <li>
      <div className="assignment-row">
        <div>
          <p className="activity-title">{content}</p>
          <p className="activity-meta">Type: {memory.memory_type}</p>
        </div>
        <Link className="btn btn-secondary btn-small" href={`/portal/memory/${workerId}/${memory.id}`}>
          View
        </Link>
      </div>
    </li>
  );
}
