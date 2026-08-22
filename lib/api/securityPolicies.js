// Server-only -- Settings & Security V1, Organisation Security. A thin,
// typed layer over lib/api/governancePolicies.js's existing generic
// governance-rules calls, pre-filled with rule_type="security"
// (SETTINGS_SECURITY_V1_ARCHITECTURE.md §1.6) -- reuses that engine's
// real organisation/department cascade and its existing admin-gated
// audit log rather than inventing a second mechanism. The three known
// rule_key values (enforce_mfa, session_timeout_minutes,
// password_min_length) are extracted into one convenient shape here so
// the Organisation Security page doesn't have to re-derive it from the
// generic effective-rules list itself.
if (typeof window !== 'undefined') {
  throw new Error('lib/api/securityPolicies.js must only be used on the server.');
}

import {
  fetchOrganisationGovernanceRules,
  setOrganisationGovernanceRule,
  fetchDepartmentGovernanceRules,
  setDepartmentGovernanceOverride,
} from './governancePolicies.js';

const SECURITY_RULE_KEYS = ['enforce_mfa', 'session_timeout_minutes', 'password_min_length'];

function extractSecurityPolicy(effectiveRules) {
  const byKey = Object.fromEntries(
    effectiveRules.filter((rule) => rule.rule_type === 'security').map((rule) => [rule.rule_key, rule])
  );

  return {
    enforce_mfa: byKey.enforce_mfa ?? null,
    session_timeout_minutes: byKey.session_timeout_minutes ?? null,
    password_min_length: byKey.password_min_length ?? null,
  };
}

export async function fetchOrganisationSecurityPolicy(token) {
  const rules = await fetchOrganisationGovernanceRules(token);
  return extractSecurityPolicy(rules);
}

export async function fetchDepartmentSecurityPolicy(token, departmentId) {
  const rules = await fetchDepartmentGovernanceRules(token, departmentId);
  return extractSecurityPolicy(rules);
}

export async function setOrganisationSecurityRule(token, ruleKey, ruleValue) {
  if (!SECURITY_RULE_KEYS.includes(ruleKey)) {
    throw new Error(`Unknown security rule_key: ${ruleKey}`);
  }
  return setOrganisationGovernanceRule(token, { rule_type: 'security', rule_key: ruleKey, rule_value: ruleValue });
}

export async function setDepartmentSecurityOverride(token, departmentId, ruleKey, ruleValue) {
  if (!SECURITY_RULE_KEYS.includes(ruleKey)) {
    throw new Error(`Unknown security rule_key: ${ruleKey}`);
  }
  return setDepartmentGovernanceOverride(token, departmentId, {
    rule_type: 'security',
    rule_key: ruleKey,
    rule_value: ruleValue,
  });
}
