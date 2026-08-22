'use client';

import { useState } from 'react';

import ConceptHelp from '@/components/portal/ConceptHelp';
import GovernanceRuleForm from '@/components/portal/GovernanceRuleForm';

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 6 -- Governance Setup. Reuses
// GovernanceRuleForm as-is (Sprint 1's own real, admin-gated write
// component for POST /governance-rules/organisation and
// POST /governance-rules/departments/{id}) rather than rebuilding it --
// no new backend surface exists for this step at all. The full
// override-review experience (a live list per department) already
// lives at /portal/admin/governance; this step teaches the concept and
// makes the first write, linking there for the rest.
export default function OnboardingWizardStep6({
  organisationRules,
  departments,
  governancePolicies,
  stepAlreadyCompleted,
}) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [completed, setCompleted] = useState(stepAlreadyCompleted);

  async function markStepComplete() {
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 6 }),
      });
      setCompleted(true);
    } catch {
      // Non-fatal -- see OnboardingWizardStep2's own identical note.
    }
  }

  return (
    <div className="wizard-step6">
      <div className="section-heading left">
        <span className="eyebrow">Governance Setup</span>
        <h2>
          Governance <ConceptHelp concept="governance" />
        </h2>
        <p className="activity-meta">
          Governance records the rules your organisation wants applied — organisation-wide by
          default, overridable per department <ConceptHelp concept="departmentOverrides" />.{' '}
          <ConceptHelp concept="governanceRules" />
        </p>
      </div>

      {completed && (
        <p className="form-note-banner" role="status">
          Governance setup saved. Set more defaults or overrides any time — the full review is
          always at Admin → Governance.
        </p>
      )}

      <div className="wizard-step6-section">
        <h3>
          Knowledge Assignment Defaults <ConceptHelp concept="knowledgeAssignment" />
        </h3>
        <p className="activity-meta">
          This is currently the one governance rule type with a real, live effect — it controls
          what a Worker can actually see. Try <code>rule_type: knowledge_assignment</code>.
        </p>
        <h3 style={{ marginTop: 20 }}>
          Approval Thresholds <ConceptHelp concept="approvalThresholds" />
        </h3>
        <p className="activity-meta">
          Stated honestly: an Approval Threshold you set here is recorded and fully audited, but
          nothing in the platform currently reads it back to gate an action yet.
        </p>

        <h4 style={{ marginTop: 20 }}>Set an organisation-wide default</h4>
        <GovernanceRuleForm onSuccess={markStepComplete} />

        {organisationRules?.length > 0 && (
          <ul className="wizard-step6-rule-list">
            {organisationRules.map((rule) => (
              <li key={`${rule.rule_type}:${rule.rule_key}`} className="wizard-step6-rule-item">
                <span className="wizard-step6-rule-type">{rule.rule_type.replace(/_/g, ' ')}</span>
                <span className="wizard-step6-rule-key">{rule.rule_key}</span>
                <span className="wizard-step6-rule-value">{JSON.stringify(rule.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="wizard-step6-section">
        <h3>Department Overrides</h3>
        <p className="activity-meta">
          Override the organisation default for one department only — everyone else keeps the
          default above.
        </p>

        <select
          value={selectedDepartmentId}
          onChange={(event) => setSelectedDepartmentId(event.target.value)}
          aria-label="Department to override"
        >
          <option value="">Select a department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>

        {selectedDepartmentId && (
          <div style={{ marginTop: 16 }}>
            <GovernanceRuleForm departmentId={selectedDepartmentId} onSuccess={markStepComplete} />
          </div>
        )}

        <p className="activity-meta" style={{ marginTop: 12 }}>
          Review every department&apos;s own overrides at{' '}
          <a href="/portal/admin/governance">Admin → Governance</a>.
        </p>
      </div>

      {governancePolicies?.length > 0 && (
        <div className="wizard-step6-section">
          <h3>Governance Policies</h3>
          <p className="activity-meta">
            A reference registry of who can do what on this platform — not something you edit,
            shown here for visibility.
          </p>
          <table className="wizard-step6-policy-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Required role</th>
              </tr>
            </thead>
            <tbody>
              {governancePolicies.map((policy) => (
                <tr key={policy.action}>
                  <td>{policy.action.replace(/_/g, ' ')}</td>
                  <td>{policy.required_role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
