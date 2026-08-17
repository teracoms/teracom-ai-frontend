import EmptyState from '@/components/portal/EmptyState';

/**
 * The Federation Registry (Phase 0 Package L, objective #1) — every
 * provider's own capability catalogue (objective #2) is shown as
 * badges. `status` is always "coming_soon" today — no real external
 * provider call exists; every consultation response is generated
 * locally via Ollama (see FederationConsultationPanel).
 */
export default function FederationProviderList({ providers }) {
  if (!providers || providers.length === 0) {
    return <EmptyState title="No federation providers registered" description="The registry is empty." />;
  }

  return (
    <ul className="activity-list">
      {providers.map((provider) => (
        <li key={provider.id}>
          <div className="assignment-row">
            <div>
              <p className="activity-title">
                {provider.display_name} <span className="badge">{provider.status}</span>
              </p>
              <p className="activity-meta">
                {provider.capabilities.join(', ')}
                {provider.cost_per_1k_tokens != null ? ` · $${provider.cost_per_1k_tokens}/1k tokens (simulated)` : ''}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
