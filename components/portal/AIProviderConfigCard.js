'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

// Only "ollama" has a real, working integration in this environment
// today (services/ai_provider_service.py#IMPLEMENTED_PROVIDERS) --
// shown honestly rather than implying every listed provider is
// equally live.
const IMPLEMENTED_PROVIDERS = new Set(['ollama']);

const PROVIDER_LABELS = {
  ollama: 'Ollama',
  openai: 'GPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  copilot: 'Copilot (Microsoft)',
};

/**
 * MULTI_ORGANISATION_PLATFORM_V1 -- the real, organisation-scoped "AI
 * Provider Configuration" data model (teracom-ai-docs/TERACOM_DECISIONS.md
 * SD-015/SD-016) made visible: a Worker represents an organisational
 * role, never a specific AI model -- this card is where an admin
 * chooses which model actually backs every worker's own turn in this
 * organisation.
 */
export default function AIProviderConfigCard({ config }) {
  const { user } = useAuth();
  const canManage = isAtLeastRole(user?.role, 'admin');
  const router = useRouter();

  const [provider, setProvider] = useState(config?.provider ?? 'ollama');
  const [modelName, setModelName] = useState(config?.model_name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);
    setSaving(true);

    try {
      const response = await fetch('/api/portal/ai-provider-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model_name: modelName.trim() || undefined }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update the AI provider configuration.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the AI provider configuration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="activity-meta">
        Currently: <span className="badge">{PROVIDER_LABELS[config?.provider] ?? config?.provider}</span>
        {config?.model_name ? ` · ${config.model_name}` : ''}
      </p>

      {!canManage ? (
        <p className="form-note">Only an admin can change this organisation&apos;s AI provider.</p>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            disabled={saving}
            aria-label="AI provider"
          >
            {Object.keys(PROVIDER_LABELS).map((key) => (
              <option key={key} value={key}>
                {PROVIDER_LABELS[key]}
                {IMPLEMENTED_PROVIDERS.has(key) ? '' : ' (not yet connected)'}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            placeholder="Model name (optional)"
            disabled={saving}
            aria-label="Model name"
          />
          <button className="btn btn-primary btn-small" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}
      {!IMPLEMENTED_PROVIDERS.has(provider) && (
        <p className="form-note">
          This provider is a real, selectable configuration value, but has no working integration in
          this environment yet — workers will report a clear error rather than silently falling back
          to Ollama.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
