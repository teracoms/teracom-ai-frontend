'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

// Mirrors backend/services/governance_cascade_service.py#RULE_TYPES
// exactly — deliberately narrow (that service's own docstring: "not
// an open-ended rule system").
const RULE_TYPES = ['governance', 'policy', 'standards', 'knowledge_assignment'];

// The four concrete example keys already named in prior planning
// (that same service's docstring) — offered here for discoverability
// via <datalist>, not a fixed enum: rule_key is free text, matching
// the backend's own lack of a key registry.
const EXAMPLE_RULE_KEYS = [
  'approval_threshold_aud',
  'support_response_sla_hours',
  'require_human_approval_for_ai_content',
  'default_knowledge_tags',
];

// rule_value is `Any` backend-side (schemas/governance_rule.py) — a
// number, boolean, string, or array are all valid. Rather than force
// the admin to pick a type, this accepts one text field and tries
// JSON.parse first (so "5000" becomes the number 5000, "true" becomes
// the boolean true, '["a","b"]' becomes an array), falling back to
// the raw trimmed string when parsing fails (so plain text like
// "Finance team" is sent as-is, not rejected).
function parseRuleValue(raw) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * GOV1 cascade — the write half of the Governance page (Phase 0
 * Package GOV1's own POST /governance-rules/organisation and
 * POST /governance-rules/departments/{id}, both real and admin-gated
 * since that package shipped, but never wired into any frontend
 * form — see TERACOM_CUSTOMER_READINESS_REVIEW_V1.md finding #15).
 * One shared component for both write endpoints, parametrised by an
 * optional `departmentId` (mirrors DepartmentBudgetPanel's own
 * departmentId-optional pattern): omitted sets the organisation-wide
 * default, provided sets that department's own override. Admin-only
 * — a presentation-layer convenience, the real gate is backend-side.
 *
 * `onSuccess` — optional, CUSTOMER_ONBOARDING_WIZARD_V1.md Step 6.
 * Called with the saved rule after a successful submit, before the
 * form resets — lets a caller (the wizard's own Step 6) react to a
 * real write without this form needing to know anything about wizard
 * progress itself. Every existing caller that doesn't pass it is
 * unaffected.
 */
export default function GovernanceRuleForm({ departmentId, onSuccess }) {
  const { user } = useAuth();
  const [ruleType, setRuleType] = useState(RULE_TYPES[0]);
  const [ruleKey, setRuleKey] = useState('');
  const [ruleValue, setRuleValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    const key = ruleKey.trim();
    if (!key || ruleValue.trim() === '') return;

    setError(null);
    setSubmitting(true);

    const url = departmentId
      ? `/api/portal/governance-rules/departments/${departmentId}`
      : '/api/portal/governance-rules/organisation';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_type: ruleType,
          rule_key: key,
          rule_value: parseRuleValue(ruleValue),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to set this rule.');
      }

      onSuccess?.(data);
      setRuleKey('');
      setRuleValue('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to set this rule.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'admin')) {
    return null;
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <select
        value={ruleType}
        onChange={(event) => setRuleType(event.target.value)}
        disabled={submitting}
        aria-label="Rule type"
      >
        {RULE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      <input
        type="text"
        list="governance-rule-keys"
        value={ruleKey}
        onChange={(event) => setRuleKey(event.target.value)}
        placeholder="Rule key (e.g. approval_threshold_aud)"
        disabled={submitting}
        aria-label="Rule key"
      />
      <datalist id="governance-rule-keys">
        {EXAMPLE_RULE_KEYS.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>

      <input
        type="text"
        value={ruleValue}
        onChange={(event) => setRuleValue(event.target.value)}
        placeholder='Value — e.g. 5000, true, "some text", or ["a","b"]'
        disabled={submitting}
        aria-label="Rule value"
      />

      <button
        className="btn btn-primary btn-small"
        type="submit"
        disabled={submitting || !ruleKey.trim() || ruleValue.trim() === ''}
      >
        {submitting ? 'Saving...' : departmentId ? 'Set Override' : 'Set Default'}
      </button>
    </form>
  );
}
