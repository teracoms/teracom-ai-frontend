import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import {
  fetchGovernancePolicies,
  fetchOrganisationGovernanceRules,
  fetchDepartmentGovernanceRules,
  fetchGovernanceAuditLog,
} from '@/lib/api/governancePolicies';
import { fetchDepartments } from '@/lib/api/departments';
import { settle, errorMessage } from '@/lib/api/results';
import GovernancePolicyTable from '@/components/portal/GovernancePolicyTable';
import GovernanceRuleForm from '@/components/portal/GovernanceRuleForm';
import ConceptHelp from '@/components/portal/ConceptHelp';

export const metadata = {
  title: 'Governance | Teracom AI Portal',
};

/**
 * Organisation policy visibility (Phase 0 Package PQR, objective #7)
 * — lives under /portal/admin, same belt-and-braces role check every
 * other admin page here uses (BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §9).
 *
 * Closes TERACOM_CUSTOMER_READINESS_REVIEW_V1.md finding #15: this
 * page used to be entirely read-only despite the backend's own GOV1
 * cascade fully supporting admin-settable org defaults and department
 * overrides (POST /governance-rules/organisation,
 * POST /governance-rules/departments/{id}, both real since GOV1
 * shipped). GovernanceRuleForm now wires both in. The department
 * picker below is a query-param selection
 * (?department=<id>, mirroring /portal/marketing's own stage-filter
 * Link pattern) rather than a client-side <select>, so the section
 * works without its own separate client island.
 */
export default async function AdminGovernancePage({ searchParams }) {
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

  const [rulesResult, auditLogResult, departmentsResult] = await Promise.allSettled([
    fetchOrganisationGovernanceRules(token),
    fetchGovernanceAuditLog(token),
    fetchDepartments(token),
  ]);
  const rules = settle(rulesResult);
  const auditLog = settle(auditLogResult);
  const departments = settle(departmentsResult);

  const selectedDepartmentId = (departments.value ?? []).some(
    (department) => department.id === searchParams?.department
  )
    ? searchParams.department
    : null;
  const selectedDepartment = selectedDepartmentId
    ? departments.value.find((department) => department.id === selectedDepartmentId)
    : null;

  let departmentRules = null;
  let departmentRulesError = null;
  if (selectedDepartmentId) {
    try {
      departmentRules = await fetchDepartmentGovernanceRules(token, selectedDepartmentId);
    } catch (error) {
      departmentRulesError = error;
    }
  }

  return (
    <main>
      <section className="hero hero-product hero-governance">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              Governance
              <ConceptHelp concept="governance" />
            </span>
            <h1>
              Governance: Policy Register.
              <ConceptHelp concept="policyRegister" />
            </h1>
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
            <h2>
              Organisation-wide governance rules.
              <ConceptHelp concept="governanceRules" />
            </h2>
            <p>
              Set once at organisation level, automatically inherited by every department unless a
              department sets its own override.
            </p>
            <p className="activity-meta">
              Today, a <code>knowledge_assignment</code> / <code>default_knowledge_tags</code> rule
              (<ConceptHelp concept="knowledgeAssignment" />) has a real, live effect: any worker
              assigned to a department is automatically granted access to every knowledge document
              tagged with one of that department&apos;s resolved tags. An <code>approval_threshold</code>{' '}
              rule (<ConceptHelp concept="approvalThresholds" />) and other rule types (
              <code>governance</code>, <code>policy</code>, <code>standards</code>) are recorded,
              inherited, overridden, and audited correctly, but nothing elsewhere in the platform
              reads them back yet — set them to document a decision, not to expect automatic
              enforcement.
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
                    <span className="activity-title">
                      {rule.rule_key.replace(/_/g, ' ')} <span className="badge">{rule.rule_type}</span>
                    </span>
                    <span className="activity-meta">{JSON.stringify(rule.value)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="section-heading left" style={{ marginTop: '24px' }}>
            <h3>Set an organisation-wide default.</h3>
          </div>
          <GovernanceRuleForm />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Cascade</span>
            <h2>
              Department overrides.
              <ConceptHelp concept="departmentOverrides" />
            </h2>
            <p>
              A department&apos;s own value for a rule wins over the organisation default — pick a
              department to see and set its overrides.
            </p>
          </div>

          {(departments.value ?? []).length === 0 ? (
            <p className="activity-meta">No departments exist yet.</p>
          ) : (
            <div className="workers-toolbar">
              {departments.value.map((department) => (
                <Link
                  key={department.id}
                  className={
                    department.id === selectedDepartmentId ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'
                  }
                  href={`/portal/admin/governance?department=${department.id}`}
                  scroll={false}
                >
                  {department.name}
                </Link>
              ))}
            </div>
          )}

          {selectedDepartment && (
            <div style={{ marginTop: '16px' }}>
              <h3>{selectedDepartment.name}&apos;s effective rules</h3>
              {departmentRulesError ? (
                <p className="form-error" role="alert">
                  {errorMessage(departmentRulesError)}
                </p>
              ) : departmentRules.length === 0 ? (
                <p className="activity-meta">
                  No rule is set yet for this department — it inherits every organisation default as-is.
                </p>
              ) : (
                <ul className="activity-list">
                  {departmentRules.map((rule) => (
                    <li key={`${rule.rule_type}:${rule.rule_key}`}>
                      <div className="assignment-row">
                        <span className="activity-title">
                          {rule.rule_key.replace(/_/g, ' ')} <span className="badge">{rule.rule_type}</span>
                        </span>
                        <span className="activity-meta">
                          {JSON.stringify(rule.value)} {rule.is_overridden ? '(overridden here)' : '(organisation default)'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="section-heading left" style={{ marginTop: '16px' }}>
                <h3>Set an override for {selectedDepartment.name}.</h3>
              </div>
              <GovernanceRuleForm departmentId={selectedDepartment.id} />
            </div>
          )}
        </div>
      </section>

      <section className="section alt">
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
