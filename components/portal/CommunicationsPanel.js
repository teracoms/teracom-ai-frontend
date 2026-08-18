import EmptyState from '@/components/portal/EmptyState';

// "Package EMAIL1" objective #12 (Communication timeline integration).
// Presentational only (Server Component) — reused for both the
// organisation-wide admin timeline and a single contact's own history;
// `entries` items may carry either shape (see lib/api/communications.js),
// so every field here is read defensively.
const STATUS_LABEL = {
  sent: 'Sent',
  failed: 'Failed',
  logged: 'Logged (no provider configured)',
};

export default function CommunicationsPanel({ entries, emptyDescription }) {
  if (!entries || entries.length === 0) {
    return <EmptyState title="No communications yet" description={emptyDescription} />;
  }

  return (
    <ul className="activity-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <p className="activity-title">
            {entry.subject || entry.notification_type || entry.template_name}
            {entry.status && <span className="badge">{STATUS_LABEL[entry.status] ?? entry.status}</span>}
          </p>
          <p className="activity-meta">
            {entry.recipient_email && `To: ${entry.recipient_email} · `}
            {new Date(entry.created_at).toLocaleString()}
          </p>
          {entry.error_message && <p className="form-error">{entry.error_message}</p>}
        </li>
      ))}
    </ul>
  );
}
