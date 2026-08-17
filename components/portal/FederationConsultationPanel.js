'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Phase 0 Package L — the worker-to-federation consultation flow
 * (objectives #4/#5), mirroring CtoOrchestrationPanel's shape:
 * "Check Confidence" is free (no Ollama call) and shows the computed
 * confidence/suggested provider — governance: "use Teracom
 * capabilities first / consult federation only when confidence is
 * insufficient or specialist expertise is required". "Consult
 * Federation" is the explicit human confirmation that actually runs
 * the (locally-generated, always-simulated) consultation.
 */
export default function FederationConsultationPanel({ workers }) {
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [consulting, setConsulting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleCheckConfidence(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || !workerId || checking || consulting) return;

    setError(null);
    setSuggestion(null);
    setResult(null);
    setChecking(true);

    try {
      const response = await fetch('/api/portal/federation/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId, message: text }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to check federation confidence.');
      }

      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check federation confidence.');
    } finally {
      setChecking(false);
    }
  }

  async function handleConsult(federationProviderId) {
    const text = message.trim();
    if (!text || !workerId) return;

    setError(null);
    setConsulting(true);

    try {
      const response = await fetch('/api/portal/federation/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: workerId,
          message: text,
          federation_provider_id: federationProviderId || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to consult federation.');
      }

      setResult(data);
      setSuggestion(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to consult federation.');
    } finally {
      setConsulting(false);
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Consult Federation</span>
        <h2>Worker-to-federation consultation.</h2>
        <p>
          Check whether a worker&apos;s confidence in answering is low enough to be worth
          escalating to an external federation provider, or consult federation directly for
          specialist expertise. Every federation response in this environment is generated
          locally and clearly marked simulated — no real external provider call is made.
        </p>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handleCheckConfidence} noValidate>
        <select
          value={workerId}
          onChange={(event) => setWorkerId(event.target.value)}
          disabled={checking || consulting}
          aria-label="Worker"
        >
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name} — {worker.role}
            </option>
          ))}
        </select>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What do you need help with?"
          disabled={checking || consulting}
          aria-label="Message"
          rows={4}
        />

        <div className="cto-panel-actions">
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={checking || consulting || !message.trim() || !workerId}
          >
            {checking ? 'Checking...' : 'Check Confidence'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleConsult(suggestion?.federation_provider_id)}
            disabled={checking || consulting || !message.trim() || !workerId}
          >
            {consulting ? 'Consulting...' : 'Consult Federation'}
          </button>
        </div>
      </form>

      {suggestion?.available === false && (
        <p className="form-note-banner" role="note">
          Federation consultation requires a Platinum licence tier, and must be enabled for this
          organisation.
        </p>
      )}

      {suggestion?.available && (
        <div className="cto-plan-preview">
          <span className="badge">{suggestion.suggested ? 'Escalation Suggested' : 'Local Confidence Sufficient'}</span>
          <p>Confidence: {suggestion.confidence_score.toFixed(2)}</p>
          {suggestion.federation_provider_name && <p>Suggested provider: {suggestion.federation_provider_name}</p>}
          {suggestion.reason && <p className="activity-meta">{suggestion.reason}</p>}
        </div>
      )}

      {result && (
        <div className="cto-result">
          <span className="badge">Simulated Federation Response</span>
          <p className="eyebrow">{result.federation_provider_name}</p>
          <p>{result.federation_response}</p>
          <p className="activity-meta">
            Confidence: {result.confidence_score.toFixed(2)}
            {result.estimated_cost != null ? ` · Estimated cost: $${result.estimated_cost.toFixed(4)} (simulated)` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
