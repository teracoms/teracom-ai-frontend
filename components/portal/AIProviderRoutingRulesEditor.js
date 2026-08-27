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
};

/**
 * MODELROUTE1 -- Mode D (Custom Routing)'s real, stored, ordered
 * fallback list. v1 is a single organisation-wide list (purpose is
 * always null server-side) -- only visible/meaningful when
 * routing_mode="custom" on the parent AIProviderConfigCard.
 */
export default function AIProviderRoutingRulesEditor({ rules: initialRules }) {
  const { user } = useAuth();
  const canManage = isAtLeastRole(user?.role, 'admin');
  const router = useRouter();

  const [rows, setRows] = useState(
    initialRules.length > 0
      ? initialRules.map((r) => ({ provider: r.provider, model_name: r.model_name ?? '' }))
      : [{ provider: 'ollama', model_name: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        rules: rows.map((row, index) => ({
          priority: index + 1,
          provider: row.provider,
          model_name: row.model_name.trim() || undefined,
        })),
      };

      const response = await fetch('/api/portal/ai-provider-routing-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      <ol className="activity-list">
        {rows.map((row, index) => (
          <li key={index}>{PROVIDER_LABELS[row.provider] ?? row.provider}{row.model_name ? ` · ${row.model_name}` : ''}</li>
        ))}
      </ol>
    );
  }

  return (
    <div>
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
        {saving ? 'Saving...' : 'Save order'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
