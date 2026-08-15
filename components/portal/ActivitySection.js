import EmptyState from '@/components/portal/EmptyState';

/**
 * Renders one category of the recent-activity feed (GET /activity/ returns
 * knowledge/chat_sessions/memories as separate arrays — see
 * lib/api/dashboard.js). Note: teracom-ai-backend orders these by primary
 * key descending, not by a created-at timestamp (none of the underlying
 * tables have one), so "recent" only reflects the backend's own ordering,
 * not true chronological order — see DASHBOARD_IMPLEMENTATION_REPORT.md.
 */
export default function ActivitySection({ title, items, renderItem, emptyDescription }) {
  return (
    <div>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <EmptyState title="Nothing here yet" description={emptyDescription} />
      ) : (
        <ul className="activity-list">
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
