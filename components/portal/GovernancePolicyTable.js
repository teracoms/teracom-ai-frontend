/**
 * Organisation policy visibility (Phase 0 Package PQR, objective #7)
 * — a read-only list of every registered governance action and the
 * role required to perform it. This registry documents this
 * package's own new endpoints as the actual enforcement mechanism,
 * plus a curated set of pre-existing admin-gated actions as honest
 * metadata (their own require_role("admin") call sites are
 * unchanged).
 */
export default function GovernancePolicyTable({ policies }) {
  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Governance</span>
        <h2>Policy registry.</h2>
      </div>
      <ul className="activity-list">
        {policies.map((policy) => (
          <li key={policy.action}>
            <p className="activity-title">{policy.action}</p>
            <p className="activity-meta">Requires: {policy.required_role}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
