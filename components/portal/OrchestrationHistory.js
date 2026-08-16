import EmptyState from '@/components/portal/EmptyState';

/**
 * Audit visibility for the customer themselves (Phase 0 Package F,
 * ORCHESTRATION_INTELLIGENCE_MVP_V1.md §7) — their own organisation's past
 * consultations, server-fetched via GET /orchestration/consultations.
 */
export default function OrchestrationHistory({ consultations, workerNamesById }) {
  if (!consultations || consultations.length === 0) {
    return (
      <EmptyState
        title="No consultations yet"
        description="When this worker consults a colleague and you approve it, the exchange will be recorded here."
      />
    );
  }

  return (
    <ul className="activity-list">
      {consultations.map((consultation) => (
        <li key={consultation.id}>
          <p className="activity-title">{consultation.original_message}</p>
          <p className="activity-meta">
            Consulted worker: {workerNamesById?.get(consultation.consulted_worker_id) ?? consultation.consulted_worker_id}{' '}
            · {consultation.created_at}
          </p>
        </li>
      ))}
    </ul>
  );
}
