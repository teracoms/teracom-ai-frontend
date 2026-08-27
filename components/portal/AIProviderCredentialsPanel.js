'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

const PROVIDER_LABELS = {
  openai: 'GPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  copilot: 'Copilot (Microsoft)',
  grok: 'Grok (xAI)',
  openrouter: 'OpenRouter',
};

const STATUS_LABELS = {
  ok: 'Verified',
  auth_failed: 'Verification failed — check the key',
  unreachable: 'Could not reach the provider',
};

/**
 * MODELROUTE1 -- customer-supplied cloud AI provider API keys. Every
 * credential is encrypted server-side and never returned by any API
 * response, not even masked -- only key_last_four/is_active/
 * last_verified_* are ever shown here.
 */
export default function AIProviderCredentialsPanel({ credentials }) {
  const { user } = useAuth();
  const canManage = isAtLeastRole(user?.role, 'admin');
  const router = useRouter();

  const [editingProvider, setEditingProvider] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave(provider) {
    if (!apiKeyInput.trim()) return;

    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/ai-provider-credentials/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKeyInput }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save this credential.');
      }

      setEditingProvider(null);
      setApiKeyInput('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this credential.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(provider) {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/ai-provider-credentials/${provider}/test`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to test this credential.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to test this credential.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(provider) {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/ai-provider-credentials/${provider}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to remove this credential.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove this credential.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <ul className="activity-list">
        <li>
          <div className="assignment-row">
            <span className="activity-title">Ollama</span>
            <span className="activity-meta">Always available, no key required</span>
          </div>
        </li>
        {credentials.map((cred) => (
          <li key={cred.provider}>
            <div className="assignment-row">
              <span className="activity-title">{PROVIDER_LABELS[cred.provider] ?? cred.provider}</span>
              <span className="activity-meta">
                {cred.is_configured
                  ? `Key ending ...${cred.key_last_four} · ${cred.is_active ? STATUS_LABELS.ok : (STATUS_LABELS[cred.last_verified_status] ?? 'Not verified')}`
                  : 'Not configured'}
              </span>
            </div>

            {canManage && (
              <div style={{ marginTop: '8px' }}>
                {editingProvider === cred.provider ? (
                  <div className="contact-form">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(event) => setApiKeyInput(event.target.value)}
                      placeholder="API key"
                      disabled={saving}
                      aria-label={`${cred.provider} API key`}
                    />
                    <button
                      className="btn btn-primary btn-small"
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave(cred.provider)}
                    >
                      {saving ? 'Saving...' : 'Save & Test'}
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setEditingProvider(null);
                        setApiKeyInput('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="btn btn-secondary btn-small"
                      type="button"
                      onClick={() => setEditingProvider(cred.provider)}
                    >
                      {cred.is_configured ? 'Update key' : 'Add key'}
                    </button>
                    {cred.is_configured && (
                      <>
                        {' '}
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          disabled={saving}
                          onClick={() => handleTest(cred.provider)}
                        >
                          Test connection
                        </button>{' '}
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          disabled={saving}
                          onClick={() => handleRemove(cred.provider)}
                        >
                          Remove key
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
