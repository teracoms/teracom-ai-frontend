'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Settings & Security V1 -- Organisation Security (Enforce MFA, Session
 * Policies, Security Policies), admin-only, via the extended governance
 * rule engine (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.6). Follows
 * GovernanceRuleForm.js's own proxy-route pattern, but with typed
 * inputs (a toggle, two number fields) instead of free-text
 * rule-key/rule-value -- the right fit for exactly three known
 * controls, not an open-ended rule editor.
 */
export default function SecurityPolicyForm({ policy }) {
  const [enforceMfa, setEnforceMfa] = useState(Boolean(policy.enforce_mfa?.value?.required));
  const [sessionTimeout, setSessionTimeout] = useState(policy.session_timeout_minutes?.value?.minutes ?? '');
  const [passwordMinLength, setPasswordMinLength] = useState(policy.password_min_length?.value?.length ?? '');
  const [submittingKey, setSubmittingKey] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function submit(ruleKey, ruleValue) {
    setError(null);
    setSubmittingKey(ruleKey);
    try {
      const response = await fetch('/api/portal/security-policies/organisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_key: ruleKey, rule_value: ruleValue }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save this policy.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this policy.');
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="assignment-row">
        <div>
          <p className="activity-title">Enforce MFA</p>
          <p className="activity-meta">
            Surfaces to every member whether your organisation requires multi-factor authentication.
            Does not yet block sign-in for a member who hasn&apos;t enrolled — see this workstream&apos;s
            own architecture doc for why that&apos;s a deliberate Phase 2 decision, not an oversight.
          </p>
        </div>
        <label>
          <input
            type="checkbox"
            checked={enforceMfa}
            onChange={(event) => {
              setEnforceMfa(event.target.checked);
              submit('enforce_mfa', { required: event.target.checked });
            }}
            disabled={submittingKey === 'enforce_mfa'}
            aria-label="Enforce MFA"
          />{' '}
          Required
        </label>
      </div>

      <form
        className="contact-form"
        onSubmit={(event) => {
          event.preventDefault();
          const minutes = Number(sessionTimeout);
          if (Number.isInteger(minutes) && minutes >= 5) submit('session_timeout_minutes', { minutes });
        }}
        noValidate
      >
        <label htmlFor="session-timeout-minutes">Session timeout (minutes)</label>
        <input
          id="session-timeout-minutes"
          type="number"
          min="5"
          value={sessionTimeout}
          onChange={(event) => setSessionTimeout(event.target.value)}
          placeholder="Platform default"
          disabled={submittingKey === 'session_timeout_minutes'}
        />
        <button
          className="btn btn-secondary btn-small"
          type="submit"
          disabled={submittingKey === 'session_timeout_minutes' || !sessionTimeout}
        >
          {submittingKey === 'session_timeout_minutes' ? 'Saving...' : 'Save'}
        </button>
      </form>

      <form
        className="contact-form"
        onSubmit={(event) => {
          event.preventDefault();
          const length = Number(passwordMinLength);
          if (Number.isInteger(length) && length >= 6) submit('password_min_length', { length });
        }}
        noValidate
      >
        <label htmlFor="password-min-length">Minimum password length</label>
        <input
          id="password-min-length"
          type="number"
          min="6"
          value={passwordMinLength}
          onChange={(event) => setPasswordMinLength(event.target.value)}
          placeholder="8 (platform default)"
          disabled={submittingKey === 'password_min_length'}
        />
        <button
          className="btn btn-secondary btn-small"
          type="submit"
          disabled={submittingKey === 'password_min_length' || !passwordMinLength}
        >
          {submittingKey === 'password_min_length' ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
