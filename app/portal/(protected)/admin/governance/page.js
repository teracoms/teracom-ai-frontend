import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import {
  fetchGovernancePolicies,
  fetchOrganisationGovernanceRules,
  fetchGovernanceAuditLog,
} from '@/lib/api/governancePolicies';
import { settle, errorMessage } from '@/lib/api/results';
import GovernancePolicyTable from '@/components/portal/GovernancePolicyTable';

export const metadata = {
  title: 'Governance | Teracom AI Portal',
};

/**
 * Organisation policy visibility (Phase 0 Package PQR, objective #7)
 * — lives under /portal/admin, same belt-and-braces role check every
 * other admin page here uses (BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §9).
 */
export default async function AdminGovernancePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Governance</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view governance policies.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAtLeastRole(decodeJwtPayload(token)?.role, 'admin')) {
    return null;
  }

  let policies;
  try {
    policies = (await fetchGovernancePolicies(token)).policies;
  } catch (error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="form-error" role="alert">
              {errorMessage(error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const [rulesResult, auditLogResult] = await Promise.allSettled([
    fetchOrganisationGovernanceRules(token),
    fetchGovernanceAuditLog(token),
  ]);
  const rules = settle(rulesResult);
  const auditLog = settle(auditLogResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Governance</span>
            <h1>Policy registry.</h1>
            <p className="lead">Every action this platform gates by role, and what role it requires.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <GovernancePolicyTable policies={policies ?? []} />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Cascade</span>
            <h2>Organisation-wide governance rules.</h2>
            <p>
              Set once at organisation level, automatically inherited by every department unless a
              department sets its own override.
            </p>
          </div>
          {rules.error ? (
            <p className="form-error" role="alert">
              {errorMessage(rules.error)}
            </p>
          ) : rules.value.length === 0 ? (
            <p className="activity-meta">No organisation-wide rule has been set yet.</p>
          ) : (
            <ul className="activity-list">
              {rules.value.map((rule) => (
                <li key={`${rule.rule_type}:${rule.rule_key}`}>
                  <div className="assignment-row">
                    <span className="activity-title">{rule.rule_key.replace(/_/g, ' ')}</span>
                    <span className="activity-meta">{JSON.stringify(rule.value)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Audit</span>
            <h2>Who changed what, and when.</h2>
          </div>
          {auditLog.error ? (
            <p className="activity-meta">You don&apos;t have access to this section.</p>
          ) : auditLog.value.length === 0 ? (
            <p className="activity-meta">No governance rule has ever been set or overridden.</p>
          ) : (
            <ul className="activity-list">
              {auditLog.value.map((entry) => (
                <li key={entry.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">
                        {entry.event_type.replace(/_/g, ' ')} — {entry.rule_key.replace(/_/g, ' ')}
                      </p>
                      <p className="activity-meta">
                        {entry.department_id ? 'Department override' : 'Organisation default'} ·{' '}
                        {new Date(entry.occurred_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
