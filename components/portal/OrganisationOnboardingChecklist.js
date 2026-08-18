'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';

/**
 * Phase 0 Package Q — the organisation-level welcome checklist, seeded by
 * the backend the moment an organisation's first licence request
 * (initial_issuance) is approved, plus one follow-up task per worker-pack
 * provisioning action. Read by any organisation member; only an admin can
 * mark a task done, mirroring WorkerCreationRequestPanel's admin-only
 * decide gate.
 */
export default function OrganisationOnboardingChecklist({ tasks }) {
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const router = useRouter();

  async function handleComplete(taskId) {
    setError(null);
    setCompletingId(taskId);

    try {
      const response = await fetch(`/api/portal/organisation-onboarding-tasks/${taskId}/complete`, {
        method: 'PATCH',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to complete this task.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete this task.');
    } finally {
      setCompletingId(null);
    }
  }

  if (!tasks || tasks.length === 0) {
    return (
      <p className="activity-meta">
        No onboarding checklist yet — this is seeded automatically once your organisation&apos;s
        first licence request is approved.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <ul className="activity-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <div className="assignment-row">
              <div>
                <p className="activity-title">
                  {task.title} <span className="badge">{task.status}</span>
                </p>
              </div>
              {task.status === 'pending' && user?.role === 'admin' && (
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => handleComplete(task.id)}
                  disabled={completingId === task.id}
                >
                  {completingId === task.id ? 'Saving...' : 'Mark done'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
