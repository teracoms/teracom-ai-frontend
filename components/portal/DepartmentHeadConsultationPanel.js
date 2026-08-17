'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Phase 0 Package I — direct, human-triggered communication between two
 * Department Heads (objective #4). Unlike OrchestrationPanel.js (Package
 * F), there is no suggestion/heuristic step: the human names both
 * participants directly (this department's head is fixed; the other is
 * chosen from a picker of every other department's current head), and
 * clicking "Consult & Synthesise" IS the trigger.
 */
export default function DepartmentHeadConsultationPanel({ primaryHeadWorkerId, primaryHeadName, otherHeads }) {
  const [consultedWorkerId, setConsultedWorkerId] = useState(otherHeads[0]?.workerId ?? '');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [consulting, setConsulting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || !consultedWorkerId || consulting) return;

    setError(null);
    setResult(null);
    setConsulting(true);

    try {
      const response = await fetch('/api/portal/department-heads/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_worker_id: primaryHeadWorkerId,
          consulted_worker_id: consultedWorkerId,
          message: text,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to run this consultation.');
      }

      setResult(data);
      setMessage('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run this consultation.');
    } finally {
      setConsulting(false);
    }
  }

  return (
    <div className="department-head-consultation-panel">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="department-head-consult-target">{primaryHeadName} consults</label>
        <select
          id="department-head-consult-target"
          value={consultedWorkerId}
          onChange={(event) => setConsultedWorkerId(event.target.value)}
          disabled={consulting}
        >
          {otherHeads.map((other) => (
            <option key={other.workerId} value={other.workerId}>
              {other.departmentName}&apos;s head
            </option>
          ))}
        </select>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. How should we align a Q3 campaign with the sales pipeline?"
          disabled={consulting}
          aria-label="Message to the other department head"
          rows={3}
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={consulting || !message.trim() || !consultedWorkerId}
        >
          {consulting ? 'Consulting...' : 'Consult & Synthesise'}
        </button>
      </form>

      {result && (
        <div className="orchestration-result">
          <span className="badge">Consultation Complete</span>
          <p className="eyebrow">{result.consulted_worker_name} said</p>
          <p>{result.consulted_worker_response}</p>
          <p className="eyebrow">{primaryHeadName}&apos;s final synthesised answer</p>
          <p>{result.primary_worker_final_response}</p>
        </div>
      )}
    </div>
  );
}
