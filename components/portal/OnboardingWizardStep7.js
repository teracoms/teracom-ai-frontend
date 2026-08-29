'use client';

import { useState } from 'react';

import ConceptHelp from '@/components/portal/ConceptHelp';
import FederationModeControl from '@/components/portal/FederationModeControl';

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 7 -- Integrations. Federation
// Providers / External AI Providers are the same real concept in this
// codebase (models/federation_provider.py's own docstring: "Federation
// Registry & External AI Consulting") and are implemented here for
// real, reusing FederationEnabledToggle (Sprint 1) and the real
// GET /federation/providers catalogue. Microsoft 365, SharePoint,
// OneDrive, Outlook, and Teams have zero backend support today (no
// OAuth flow, no Graph API code anywhere -- confirmed directly,
// FEDERATION2_ASSESSMENT.md) and are shown honestly as not yet
// available, per instruction ("implement only what is safe and
// already supported. Document anything requiring architecture
// decisions.") -- see INTEGRATIONS_ARCHITECTURE_V1.md.
const NOT_YET_AVAILABLE = [
  { name: 'Microsoft 365', note: 'Would need Azure AD app registration and OAuth2/OIDC — not built.' },
  { name: 'SharePoint', note: 'Would need Microsoft Graph API access — no Graph code exists anywhere in this backend today.' },
  { name: 'OneDrive', note: 'Same Graph API dependency as SharePoint.' },
  { name: 'Outlook', note: 'Same Graph API dependency, plus a real decision on mailbox-access scope.' },
  { name: 'Teams', note: 'Same Graph API dependency, plus a real decision on what a Teams integration should actually do.' },
];

export default function OnboardingWizardStep7({ organisation, federationProviders, stepAlreadyCompleted }) {
  const [completed, setCompleted] = useState(stepAlreadyCompleted);

  async function markStepComplete() {
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 7 }),
      });
      setCompleted(true);
    } catch {
      // Non-fatal -- see OnboardingWizardStep2's own identical note.
    }
  }

  return (
    <div className="wizard-step7">
      <div className="section-heading left">
        <span className="eyebrow">Integrations</span>
        <h2>
          Federation &amp; External AI Providers <ConceptHelp concept="federation" />
        </h2>
        <p className="activity-meta">
          Federation lets a Worker escalate a question it can&apos;t confidently answer to an
          external AI provider for a second opinion. This is real and configurable today —
          currently every provider below is a stub connector, so an escalation is simulated
          locally rather than sent externally, and is always marked as such, never presented as a
          real external call.
        </p>
      </div>

      {completed && (
        <p className="form-note-banner" role="status">
          Integrations reviewed. Change your federation setting any time from here.
        </p>
      )}

      <div className="wizard-step7-section">
        <h3>Federation setting</h3>
        {organisation ? (
          <FederationModeControl organisation={organisation} />
        ) : (
          <p className="activity-meta">Unable to load your organisation&apos;s federation setting.</p>
        )}
        <button type="button" className="btn btn-secondary" onClick={markStepComplete} style={{ marginTop: 12 }}>
          Continue
        </button>
      </div>

      {federationProviders?.length > 0 && (
        <div className="wizard-step7-section">
          <h3>Federation / External AI provider catalogue</h3>
          <ul className="wizard-step7-provider-list">
            {federationProviders.map((provider) => (
              <li key={provider.id} className="wizard-step7-provider-item">
                <span className="wizard-step7-provider-name">{provider.display_name}</span>
                <span className="wizard-step7-provider-status">{provider.status.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="wizard-step7-section">
        <h3>Microsoft 365 &amp; related integrations</h3>
        <p className="activity-meta">
          Not yet available on this platform — each one is an honest architecture question, not
          just unbuilt UI. Full detail: <code>INTEGRATIONS_ARCHITECTURE_V1.md</code>.
        </p>
        <ul className="wizard-step7-notyet-list">
          {NOT_YET_AVAILABLE.map((item) => (
            <li key={item.name} className="wizard-step7-notyet-item">
              <span className="wizard-step7-notyet-name">{item.name}</span>
              <span className="activity-meta">{item.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
