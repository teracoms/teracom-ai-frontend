import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchOrganisationSecurityPolicy } from '@/lib/api/securityPolicies';
import { fetchGovernanceAuditLog } from '@/lib/api/governancePolicies';
import { fetchSecurityAuditLog } from '@/lib/api/securityEvents';
import { settle, errorMessage } from '@/lib/api/results';
import SecurityPolicyForm from '@/components/portal/SecurityPolicyForm';

export const metadata = {
  title: 'Organisation Security | Teracom AI Portal',
};

/**
 * Settings & Security V1 -- Organisation Security: Enforce MFA, Session
 * Policies, Security Policies, Audit Controls
 * (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.6, §5). Admin-gated, same
 * belt-and-braces role check every other admin page here uses
 * (app/(product)/portal/(protected)/admin/governance/page.js).
 *
 * Audit Controls combines two distinct backend tables into one
 * timeline: GovernanceAuditLog filtered to rule_type="security" (rule
 * changes made on this page) and SecurityEventLog (login/password/MFA
 * events) -- these are not merged server-side into one endpoint,
 * deliberately (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.4's own note).
 */
export default async function AdminSecurityPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Organisation Security</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAtLeastRole(decodeJwtPayload(token)?.role, 'admin')) {
    return null;
  }

  const [policyResult, governanceAuditResult, securityAuditResult] = await Promise.allSettled([
    fetchOrganisationSecurityPolicy(token),
    fetchGovernanceAuditLog(token),
    fetchSecurityAuditLog(token),
  ]);
  const policy = settle(policyResult);
  const governanceAudit = settle(governanceAuditResult);
  const securityAudit = settle(securityAuditResult);

  const combinedAuditEntries = [
    ...(governanceAudit.value ?? [])
      .filter((entry) => entry.rule_type === 'security')
      .map((entry) => ({
        id: `gov-${entry.id}`,
        label: `${entry.event_type.replace(/_/g, ' ')} — ${entry.rule_key.replace(/_/g, ' ')}`,
        occurred_at: entry.occurred_at,
      })),
    ...(securityAudit.value ?? []).map((entry) => ({
      id: `sec-${entry.id}`,
      label: entry.event_type.replace(/_/g, ' '),
      occurred_at: entry.occurred_at,
    })),
  ].sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Organisation Security</span>
            <h1>Security policy for your organisation.</h1>
            <p className="lead">
              Enforce MFA, session timeout, and password requirements — applied organisation-wide,
              overridable per department via the same governance engine as every other rule.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {policy.error ? (
            <p className="form-error" role="alert">
              {errorMessage(policy.error)}
            </p>
          ) : (
            <SecurityPolicyForm policy={policy.value} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Audit</span>
            <h2>Security events for your organisation.</h2>
          </div>
          {governanceAudit.error && securityAudit.error ? (
            <p className="activity-meta">You don&apos;t have access to this section.</p>
          ) : combinedAuditEntries.length === 0 ? (
            <p className="activity-meta">No security event has been recorded yet.</p>
          ) : (
            <ul className="activity-list">
              {combinedAuditEntries.map((entry) => (
                <li key={entry.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">{entry.label}</p>
                      <p className="activity-meta">{new Date(entry.occurred_at).toLocaleString()}</p>
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
