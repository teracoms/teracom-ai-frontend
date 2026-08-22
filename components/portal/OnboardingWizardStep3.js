'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ConceptHelp from '@/components/portal/ConceptHelp';
import OrganisationStructureVisual from '@/components/portal/OrganisationStructureVisual';
import { EXECUTIVE_ROLES } from '@/lib/executiveRoles';

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 3 -- Executive Structure.
// Deliberately does not let an admin "create an Executive Orchestrator"
// -- requirement #1 asks for *visibility*, not a creatable entity (see
// lib/helpContent.js#executiveTeam's own relatedConcepts entry on this
// exact point). Selecting/deselecting a role toggles it via
// POST/DELETE /api/portal/executive-roles -- no form, no save button,
// matching the toggle-button convention this wizard already uses for
// Step 2's department templates.
export default function OnboardingWizardStep3({
  organisationName,
  initialExecutiveRoles,
  departments,
  workers,
  stepAlreadyCompleted,
}) {
  const router = useRouter();
  const [selectedKeys, setSelectedKeys] = useState(new Set(initialExecutiveRoles.map((r) => r.role_key)));
  const [pendingKey, setPendingKey] = useState(null);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(stepAlreadyCompleted);

  async function markStepComplete() {
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 3 }),
      });
      setCompleted(true);
    } catch {
      // Non-fatal -- the role selection itself already succeeded; see
      // OnboardingWizardStep2's own identical note on this.
    }
  }

  async function toggleRole(roleKey) {
    setPendingKey(roleKey);
    setError(null);
    const alreadySelected = selectedKeys.has(roleKey);

    try {
      if (alreadySelected) {
        const response = await fetch(`/api/portal/executive-roles/${roleKey}`, { method: 'DELETE' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to remove this executive role.');
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          next.delete(roleKey);
          return next;
        });
      } else {
        const response = await fetch('/api/portal/executive-roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_key: roleKey }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to select this executive role.');
        setSelectedKeys((prev) => new Set(prev).add(roleKey));
        await markStepComplete();
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this executive role.');
    } finally {
      setPendingKey(null);
    }
  }

  const selectedRoles = EXECUTIVE_ROLES.filter((role) => selectedKeys.has(role.key));

  return (
    <div className="wizard-step3">
      <div className="section-heading left">
        <span className="eyebrow">Executive Structure</span>
        <h2>Executive Team</h2>
        <p className="activity-meta">
          Select the named leadership roles that exist at your organisation. This records your
          organisation&apos;s structure — it doesn&apos;t create accounts or people.
        </p>
      </div>

      {completed && (
        <p className="form-note-banner" role="status">
          Executive structure saved. Select or remove roles any time — this step stays available
          after setup.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="wizard-step3-orchestrator-card">
        <div>
          <p>
            <strong>Executive Orchestrator</strong> <ConceptHelp concept="orchestration" />
          </p>
          <p className="activity-meta">
            Orchestration lets a high-level request get broken into subtasks and routed to the
            right department automatically — every department participates by default, there is
            nothing to set up here.
          </p>
        </div>
      </div>

      <p>
        Department Heads <ConceptHelp concept="departmentHeads" /> and{' '}
        how Departments relate to Workers <ConceptHelp concept="department" />
      </p>
      <p className="activity-meta">
        Department Heads become available once a department has at least one Worker — Digital
        Workforce setup is coming in a later wizard step. Once your organisation has Workers, it&apos;s
        common for a Department Head to also hold one of the Executive Team roles below (for
        example, your Sales department&apos;s head also being your &quot;Head of Sales&quot;).{' '}
        <ConceptHelp concept="executiveTeam" />
      </p>

      <div className="wizard-step3-role-grid">
        {EXECUTIVE_ROLES.map((role) => {
          const isSelected = selectedKeys.has(role.key);
          return (
            <button
              type="button"
              key={role.key}
              className={'wizard-step3-role-toggle' + (isSelected ? ' selected' : '')}
              onClick={() => toggleRole(role.key)}
              disabled={pendingKey === role.key}
            >
              <span>{role.label}</span>
              <span className="wizard-step3-role-check">{isSelected ? 'Selected' : 'Select'}</span>
            </button>
          );
        })}
      </div>

      <OrganisationStructureVisual
        organisationName={organisationName}
        executiveRoles={selectedRoles}
        departments={departments}
        workers={workers}
      />
    </div>
  );
}
