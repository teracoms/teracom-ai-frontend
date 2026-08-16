'use client';

import { useState } from 'react';

/**
 * Phase 0 Package F (Orchestration Intelligence): a self-contained
 * suggest → approve → consult flow. POST /orchestration/suggest is free (no
 * Ollama call — just the local heuristic and tier gate, see
 * services/orchestration_service.py), so checking costs nothing; POST
 * /orchestration/consult only ever runs after the customer explicitly clicks
 * "Consult & Synthesise" below — that click IS the approval workflow
 * (ORCHESTRATION_INTELLIGENCE_MVP_V1.md §7), there is no separate
 * confirmation step.
 */
export default function OrchestrationPanel({ workerId, onConsultationComplete }) {
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [consulting, setConsulting] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheck(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || checking) return;

    setError(null);
    setSuggestion(null);
    setResult(null);
    setChecking(true);

    try {
      const response = await fetch('/api/portal/orchestration/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_worker_id: workerId, message: text }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to check for a colleague worker.');
      }

      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check for a colleague worker.');
    } finally {
      setChecking(false);
    }
  }

  async function handleConsult() {
    if (!suggestion?.suggested || consulting) return;
    const text = message.trim();
    if (!text) return;

    setError(null);
    setConsulting(true);

    try {
      const response = await fetch('/api/portal/orchestration/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_worker_id: workerId,
          consulted_worker_id: suggestion.consulted_worker_id,
          message: text,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to run this consultation.');
      }

      setResult(data);
      onConsultationComplete?.(text, data);
      setSuggestion(null);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run this consultation.');
    } finally {
      setConsulting(false);
    }
  }

  return (
    <div className="orchestration-panel">
      <p className="eyebrow">Orchestration Intelligence</p>
      <p>
        Ask a question this worker might answer better with help from a colleague — it can
        consult another worker in your organisation and synthesise a combined answer.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleCheck}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. Can you help configure our firewall?"
          disabled={checking || consulting}
          aria-label="Question to check for a related colleague worker"
          rows={2}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={checking || consulting || !message.trim()}
        >
          {checking ? 'Checking...' : 'Check for a Colleague Worker'}
        </button>
      </form>

      {suggestion && !suggestion.available && (
        <p className="form-note-banner" role="note">
          Orchestration Intelligence requires a Platinum licence tier.
        </p>
      )}

      {suggestion && suggestion.available && !suggestion.suggested && (
        <p className="form-note-banner" role="note">
          No related colleague worker was found for this question.
        </p>
      )}

      {suggestion?.suggested && (
        <div className="orchestration-suggestion">
          <span className="badge">Suggested: {suggestion.consulted_worker_name}</span>
          <p>{suggestion.reason}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConsult}
            disabled={consulting}
          >
            {consulting ? 'Consulting...' : `Consult ${suggestion.consulted_worker_name} & Synthesise`}
          </button>
        </div>
      )}

      {result && (
        <div className="orchestration-result">
          <span className="badge">Consultation Complete</span>
          <p className="eyebrow">{result.consulted_worker_name} said</p>
          <p>{result.consulted_worker_response}</p>
          <p className="eyebrow">Final synthesised answer</p>
          <p>{result.primary_worker_final_response}</p>
        </div>
      )}
    </div>
  );
}
