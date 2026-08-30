'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

const PROVIDER_LABELS = {
  ollama: 'Ollama',
  openai: 'GPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  copilot: 'Copilot (Microsoft)',
  grok: 'Grok (xAI)',
  openrouter: 'OpenRouter',
  deepseek: 'DeepSeek',
  qwen: 'Qwen (Alibaba Cloud)',
};

// LITELLM_PRODUCTION_AND_MODEL_ROUTING_V1 Phase 4 -- mirrors the
// backend's own real PURPOSES (services/ai_provider_service.py)
// exactly; human-readable labels only, not a redefinition of the set.
const PURPOSE_LABELS = {
  orchestrator: 'Orchestrator conversation',
  // CLOUD_PROVIDER_GUI_LIFECYCLE_V1 -- the real "Assign Workers/
  // Departments" GUI action, per SD-015: a Worker's own row never
  // carries a model choice, so assignment happens by *purpose*
  // (which class of turn this is) rather than by naming a literal
  // Worker. orchestrator_voice/engineering_execution were added to
  // the backend's own real PURPOSES after this editor was first
  // built; this was a real, stale gap, not a deliberate omission.
  orchestrator_voice: 'Orchestrator voice conversations',
  worker_execution: 'Worker task execution (every other department)',
  engineering_execution: 'Engineering Department task execution',
  persona: 'Executive persona chat',
  content: 'Content generation',
  proposal: 'Proposal generation',
  video_script: 'Video script generation',
  requirements: 'Requirements extraction',
  cto_planning: 'CTO planning',
  memory_summary: 'Memory summarisation',
  federation_consultation: 'Federation consultation',
  consultation: 'Worker consultation',
};

/**
 * LITELLM_PRODUCTION_AND_MODEL_ROUTING_V1 Phase 4 -- Mode D (Custom
 * Routing)'s stored rule set, now real for two independent groups:
 * the organisation-wide catch-all fallback chain (unchanged from v1 --
 * purpose always null, an ordered list) and, new, a per-workload
 * Primary Model -- at most one rule per real purpose
 * (services/ai_provider_service.py#PURPOSES), falling back to the
 * catch-all chain on failure rather than its own separate ordered
 * list (services/ai_provider_service.py#_get_routing_rules()). Both
 * groups save together in one PUT, matching the backend's own
 * replace-in-place semantics.
 */
export default function AIProviderRoutingRulesEditor({ rules: initialRules }) {
  const { user } = useAuth();
  const canManage = isAtLeastRole(user?.role, 'admin');
  const router = useRouter();

  const initialCatchAll = initialRules.filter((r) => !r.purpose);
  const initialByPurpose = initialRules.filter((r) => r.purpose);

  const [rows, setRows] = useState(
    initialCatchAll.length > 0
      ? initialCatchAll.map((r) => ({ provider: r.provider, model_name: r.model_name ?? '' }))
      : [{ provider: 'ollama', model_name: '' }]
  );
  const [workloadRules, setWorkloadRules] = useState(
    initialByPurpose.map((r) => ({ purpose: r.purpose, provider: r.provider, model_name: r.model_name ?? '' }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const usedPurposes = new Set(workloadRules.map((r) => r.purpose));
  const availablePurposes = Object.keys(PURPOSE_LABELS).filter((p) => !usedPurposes.has(p));

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { provider: 'ollama', model_name: '' }]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function moveRow(index, direction) {
    setRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateWorkloadRule(index, field, value) {
    setWorkloadRules((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addWorkloadRule() {
    if (availablePurposes.length === 0) return;
    setWorkloadRules((prev) => [...prev, { purpose: availablePurposes[0], provider: 'ollama', model_name: '' }]);
  }

  function removeWorkloadRule(index) {
    setWorkloadRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const catchAllPayload = rows.map((row, index) => ({
        purpose: null,
        priority: index + 1,
        provider: row.provider,
        model_name: row.model_name.trim() || undefined,
      }));
      const workloadPayload = workloadRules.map((row) => ({
        purpose: row.purpose,
        priority: 1,
        provider: row.provider,
        model_name: row.model_name.trim() || undefined,
      }));

      const response = await fetch('/api/portal/ai-provider-routing-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: [...workloadPayload, ...catchAllPayload] }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save the routing order.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the routing order.');
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <div>
        {workloadRules.length > 0 && (
          <>
            <p className="activity-meta">Workload-specific Primary Models:</p>
            <ol className="activity-list">
              {workloadRules.map((row, index) => (
                <li key={index}>
                  {PURPOSE_LABELS[row.purpose] ?? row.purpose}: {PROVIDER_LABELS[row.provider] ?? row.provider}
                  {row.model_name ? ` · ${row.model_name}` : ''}
                </li>
              ))}
            </ol>
          </>
        )}
        <p className="activity-meta">Catch-all fallback chain:</p>
        <ol className="activity-list">
          {rows.map((row, index) => (
            <li key={index}>{PROVIDER_LABELS[row.provider] ?? row.provider}{row.model_name ? ` · ${row.model_name}` : ''}</li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div>
      <div className="section-heading left" style={{ marginTop: 0 }}>
        <h4 style={{ margin: 0 }}>Workload-Specific Primary Models</h4>
      </div>
      <p className="form-note">
        Route a specific kind of work to its own model, falling back to the catch-all chain below if it
        fails. At most one Primary Model per workload today.
      </p>
      {workloadRules.map((row, index) => (
        <div key={index} className="contact-form" style={{ marginBottom: '8px' }}>
          <select
            value={row.purpose}
            onChange={(event) => updateWorkloadRule(index, 'purpose', event.target.value)}
            disabled={saving}
            aria-label={`Workload for rule ${index + 1}`}
          >
            <option value={row.purpose}>{PURPOSE_LABELS[row.purpose] ?? row.purpose}</option>
            {availablePurposes.map((p) => (
              <option key={p} value={p}>
                {PURPOSE_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            value={row.provider}
            onChange={(event) => updateWorkloadRule(index, 'provider', event.target.value)}
            disabled={saving}
            aria-label={`Provider for workload ${index + 1}`}
          >
            {Object.keys(PROVIDER_LABELS).map((key) => (
              <option key={key} value={key}>
                {PROVIDER_LABELS[key]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={row.model_name}
            onChange={(event) => updateWorkloadRule(index, 'model_name', event.target.value)}
            placeholder="Model name (optional)"
            disabled={saving}
            aria-label={`Model name for workload ${index + 1}`}
          />
          <button className="btn btn-secondary btn-small" type="button" disabled={saving} onClick={() => removeWorkloadRule(index)}>
            Remove
          </button>
        </div>
      ))}
      <button
        className="btn btn-secondary btn-small"
        type="button"
        disabled={saving || availablePurposes.length === 0}
        onClick={addWorkloadRule}
      >
        Add workload override
      </button>

      <div className="section-heading left">
        <h4 style={{ margin: 0 }}>Catch-All Fallback Chain</h4>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="contact-form" style={{ marginBottom: '8px' }}>
          <span className="activity-meta">{index + 1}.</span>
          <select
            value={row.provider}
            onChange={(event) => updateRow(index, 'provider', event.target.value)}
            disabled={saving}
            aria-label={`Provider for step ${index + 1}`}
          >
            {Object.keys(PROVIDER_LABELS).map((key) => (
              <option key={key} value={key}>
                {PROVIDER_LABELS[key]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={row.model_name}
            onChange={(event) => updateRow(index, 'model_name', event.target.value)}
            placeholder="Model name (optional)"
            disabled={saving}
            aria-label={`Model name for step ${index + 1}`}
          />
          <button className="btn btn-secondary btn-small" type="button" disabled={saving || index === 0} onClick={() => moveRow(index, -1)}>
            Up
          </button>
          <button className="btn btn-secondary btn-small" type="button" disabled={saving || index === rows.length - 1} onClick={() => moveRow(index, 1)}>
            Down
          </button>
          <button className="btn btn-secondary btn-small" type="button" disabled={saving || rows.length === 1} onClick={() => removeRow(index)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary btn-small" type="button" disabled={saving} onClick={addRow}>
        Add step
      </button>{' '}
      <button className="btn btn-primary btn-small" type="button" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving...' : 'Save routing'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
