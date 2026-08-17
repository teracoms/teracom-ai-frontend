// Objective #10 — the aggregated SupportRequestMessage thread across every
// one of the caller's own requests. No separate timeline table exists.
export default function PortalCommunicationsTimeline({ entries }) {
  if (entries.length === 0) {
    return <p className="activity-meta">No communications yet.</p>;
  }

  return (
    <ul className="activity-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <p className="activity-title">
            {entry.support_request_subject} <span className="badge">{entry.request_type}</span>
          </p>
          <p className="activity-meta">
            {entry.sender_type === 'portal_contact' ? 'You' : 'Support team'}: {entry.body}
          </p>
          <p className="activity-meta">{new Date(entry.created_at).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
