'use client';

import { useState } from 'react';

/**
 * Phase 0 Package G (Autonomous CTO & Organisational Intelligence):
 * a human always submits the objective (the design decision this
 * package was built against). From there, two review points are
 * offered, matching that decision exactly:
 *
 * (a) "Generate Plan" — free, no Ollama call — shows the proposed
 *     decomposition/roadmap; "Approve & Run Chain" then executes
 *     exactly that reviewed plan, autonomously, with no per-hop
 *     confirmation.
 * (b) "Execute Now" — skips the plan review and runs the whole
 *     bounded chain immediately; the human instead reviews the
 *     executive synthesis once it's done.
 *
 * Either way, nothing runs until this component's owner explicitly
 * clicks a button — there is no autonomous, unprompted trigger.
 */
export default function CtoOrchestrationPanel({ workers, onExecutionComplete }) {
  const [leadWorkerId, setLeadWorkerId] = useState(workers[0]?.id ?? '');
  const [objective, setObjective] = useState('');
  const [maxHops, setMaxHops] = useState('');

  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);

  const parsedMaxHops = Number.parseInt(maxHops, 10);
  const maxHopsValue = Number.isInteger(parsedMaxHops) && parsedMaxHops > 0 ? parsedMaxHops : undefined;

  async function handleGeneratePlan(event) {
    event.preventDefault();
    const text = objective.trim();
    if (!text || !leadWorkerId || planning || executing) return;

    setError(null);
    setPlan(null);
    setResult(null);
    setPlanning(true);

    try {
      const response = await fetch('/api/portal/cto/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_worker_id: leadWorkerId,
          objective: text,
          ...(maxHopsValue ? { max_hops: maxHopsValue } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate a plan.');
      }

      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate a plan.');
    } finally {
      setPlanning(false);
    }
  }

  async function runExecute(steps) {
    const text = objective.trim();
    setError(null);
    setExecuting(true);

    try {
      const response = await fetch('/api/portal/cto/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_worker_id: leadWorkerId,
          objective: text,
          ...(steps ? { steps } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to run this chain.');
      }

      setResult(data);
      setPlan(null);
      onExecutionComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run this chain.');
    } finally {
      setExecuting(false);
    }
  }

  function handleApproveAndRun() {
    if (!plan?.steps?.length || executing) return;
    runExecute(plan.steps.map((step) => ({ worker_id: step.worker_id, subtask: step.subtask })));
  }

  function handleExecuteDirectly(event) {
    event.preventDefault();
    const text = objective.trim();
    if (!text || !leadWorkerId || planning || executing) return;
    runExecute(undefined);
  }

  return (
    <div className="cto-panel">
      <p className="eyebrow">Autonomous CTO</p>
      <p>
        Submit a high-level objective. The CTO worker below may decompose it and delegate across
        your workers in a bounded chain (no approval between individual hops) — you choose whether
        to review the proposed plan first, or review the finished result afterward.
      </p>
      <p className="activity-meta">
        Phase 0 Package H: the executive synthesis now draws on each involved worker&apos;s own
        memory plus their department&apos;s memory; organisation-wide memory is included too when
        you (the person running this chain) are an organisation admin.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="cto-panel-form">
        <label htmlFor="cto-lead-worker">Lead (executive) worker</label>
        <select
          id="cto-lead-worker"
          value={leadWorkerId}
          onChange={(event) => setLeadWorkerId(event.target.value)}
          disabled={planning || executing}
        >
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name} — {worker.role}
            </option>
          ))}
        </select>

        <textarea
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          placeholder={'e.g.\n1. Review our firewall configuration.\n2. Draft an onboarding plan for new hires.'}
          aria-label="Objective"
          disabled={planning || executing}
          rows={4}
        />

        <label htmlFor="cto-max-hops">Hop limit (optional)</label>
        <input
          id="cto-max-hops"
          type="number"
          min="1"
          value={maxHops}
          onChange={(event) => setMaxHops(event.target.value)}
          placeholder="Default"
          disabled={planning || executing}
        />

        <div className="cto-panel-actions">
          <button
            type="submit"
            className="btn btn-secondary"
            onClick={handleGeneratePlan}
            disabled={planning || executing || !objective.trim() || !leadWorkerId}
          >
            {planning ? 'Generating Plan...' : 'Generate Plan'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExecuteDirectly}
            disabled={planning || executing || !objective.trim() || !leadWorkerId}
          >
            {executing && !plan ? 'Running Chain...' : 'Execute Now (review after)'}
          </button>
        </div>
      </form>

      {plan?.available === false && (
        <p className="form-note-banner" role="note">
          Autonomous CTO Orchestration requires a Platinum licence tier.
        </p>
      )}

      {plan?.available && (
        <div className="cto-plan-preview">
          <span className="badge">
            Proposed Plan {plan.truncated ? '(truncated to the hop limit)' : ''}
          </span>
          <ol className="cto-roadmap">
            {plan.roadmap.map((phase) => (
              <li key={phase.phase}>
                <strong>
                  {phase.title}
                  {phase.is_department_head ? ' — Department Head' : ''}
                </strong>
                <p>{phase.summary}</p>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApproveAndRun}
            disabled={executing}
          >
            {executing ? 'Running Chain...' : 'Approve & Run Chain'}
          </button>
        </div>
      )}

      {result && (
        <div className="cto-result">
          <span className="badge">Chain Complete</span>
          <ol className="cto-chain-steps">
            {result.steps.map((step) => (
              <li key={step.step_number}>
                <strong>
                  Step {step.step_number} — {step.worker_name}
                  {step.is_department_head ? ' (Department Head)' : ''}
                </strong>
                <p className="cto-subtask">{step.subtask}</p>
                <p>{step.response}</p>
              </li>
            ))}
          </ol>
          <p className="eyebrow">Executive Synthesis</p>
          <p>{result.executive_synthesis}</p>
        </div>
      )}
    </div>
  );
}
