import OrganisationStructureVisual from '@/components/portal/OrganisationStructureVisual';
import MarkWizardStepComplete from '@/components/portal/MarkWizardStepComplete';
import { executiveRoleLabel } from '@/lib/executiveRoles';

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 8 -- Organisation Review. Pure
// presentation, no new data of its own -- every count and the visual
// org chart come from data already fetched for Steps 2-6 on the
// wizard page itself. A Server Component (no 'use client') other than
// the one small "Continue" action at the bottom (MarkWizardStepComplete).
export default function OnboardingWizardStep8({
  organisationName,
  departments,
  executiveRoles,
  workers,
  knowledgeCount,
  governanceRuleCount,
}) {
  const departmentById = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const executiveRoleById = Object.fromEntries(
    executiveRoles.map((r) => [r.id, executiveRoleLabel(r.role_key)])
  );
  const decoratedWorkers = workers.map((w) => ({
    ...w,
    departmentLabel: w.department_id ? departmentById[w.department_id] : null,
    executiveOwnerLabel: w.executive_owner_id ? executiveRoleById[w.executive_owner_id] : null,
  }));

  return (
    <div className="wizard-step8">
      <div className="section-heading left">
        <span className="eyebrow">Organisation Review</span>
        <h2>Your organisation, end to end</h2>
        <p className="activity-meta">
          Everything you&apos;ve set up so far, in one place — Organisation, Executive Team,
          Departments, Workers, Knowledge, and Governance.
        </p>
      </div>

      <OrganisationStructureVisual
        organisationName={organisationName}
        executiveRoles={executiveRoles.map((r) => ({ key: r.role_key, label: executiveRoleLabel(r.role_key) }))}
        departments={departments}
        workers={decoratedWorkers}
      />

      <div className="wizard-step8-summary-grid">
        <div className="wizard-step8-summary-card">
          <span className="wizard-step8-summary-count">{executiveRoles.length}</span>
          <span className="wizard-step8-summary-label">Executive roles</span>
        </div>
        <div className="wizard-step8-summary-card">
          <span className="wizard-step8-summary-count">{departments.length}</span>
          <span className="wizard-step8-summary-label">Departments</span>
        </div>
        <div className="wizard-step8-summary-card">
          <span className="wizard-step8-summary-count">{workers.length}</span>
          <span className="wizard-step8-summary-label">Workers</span>
        </div>
        <div className="wizard-step8-summary-card">
          <span className="wizard-step8-summary-count">{knowledgeCount}</span>
          <span className="wizard-step8-summary-label">Knowledge documents</span>
        </div>
        <div className="wizard-step8-summary-card">
          <span className="wizard-step8-summary-count">{governanceRuleCount}</span>
          <span className="wizard-step8-summary-label">Governance rules</span>
        </div>
      </div>

      <MarkWizardStepComplete step={8} label="Continue to Launch" />
    </div>
  );
}
