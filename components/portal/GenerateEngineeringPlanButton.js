'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// PROJECT_EXECUTION_AND_VOICE_V1 -- real bottleneck found live while
// tracing Conversation -> Requirements -> Project -> Task Creation ->
// Execution -> Output: POST /projects/{id}/engineering-plan
// (ENGINEERING_DEPARTMENT_V1) was fully built and tested on the
// backend -- decomposes a project's own real, already-captured
// Requirements into a chained, worker-routed Task plan -- but had
// zero caller anywhere in this frontend, confirmed by a full search.
// A project could sit with real Requirements and never get a single
// Task, because nothing in the product ever called the endpoint that
// creates them. This is the one, minimal UI needed to reach it --
// admin-gated (Administration Mode's own Activity tab), same trust
// boundary as task execution itself (ENGINEERING_DEPARTMENT_V1's own
// "execution kept admin/staff-triggered").
export default function GenerateEngineeringPlanButton({ projectId, primaryWorkerId }) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  if (!primaryWorkerId) {
    return (
      <p className="form-note">
        Generating an engineering plan needs a worker assigned to this project&apos;s conversation first.
      </p>
    );
  }

  async function handleGenerate() {
    setError(null);
    setResult(null);
    setGenerating(true);

    try {
      const response = await fetch(`/api/portal/projects/${projectId}/engineering-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_worker_id: primaryWorkerId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate an engineering plan right now.');
      }

      setResult(data);
      if (data.available) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate an engineering plan right now.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-primary btn-small" disabled={generating} onClick={handleGenerate}>
        {generating && <span className="btn-spinner" aria-hidden="true" />}
        {generating ? 'Generating plan...' : 'Generate Engineering Plan'}
      </button>
      <p className="activity-meta" style={{ marginTop: '0.5rem' }}>
        Decomposes this project&apos;s own captured Requirements into a real, worker-routed task chain
        (Developer → QA → Documentation), the same automatic handoff/Output pipeline already in place below.
      </p>
      {result && !result.available && (
        <p className="form-note">Not available on this organisation&apos;s current licence tier.</p>
      )}
      {result?.available && result.tasks?.length > 0 && (
        <p className="form-note-banner" role="status">
          {result.tasks.length} {result.tasks.length === 1 ? 'task' : 'tasks'} created.
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
