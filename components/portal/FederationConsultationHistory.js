import EmptyState from '@/components/portal/EmptyState';

/**
 * Audit visibility for the customer themselves (Phase 0 Package L) —
 * every completed federation consultation belonging to their own
 * organisation, most recent first.
 */
export default function FederationConsultationHistory({ consultations }) {
  if (!consultations || consultations.length === 0) {
    return <EmptyState title="No federation consultations yet" description="Consult federation above to get started." />;
  }

  return (
    <ul className="activity-list">
      {consultations.map((consultation) => (
        <li key={consultation.id}>
          <p className="activity-title">
            {consultation.original_message} <span className="badge">simulated</span>
          </p>
          <p className="activity-meta">{consultation.federation_response}</p>
          <p className="activity-meta">
            Confidence: {consultation.confidence_score.toFixed(2)}
            {consultation.estimated_cost != null ? ` · Estimated cost: $${consultation.estimated_cost.toFixed(4)}` : ''}
            {' · '}
            {new Date(consultation.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
