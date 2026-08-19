'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Customer onboarding workflows (Phase 0 Package J, objective #6).
 * "Seed Default Checklist" creates a fixed, deterministic set of tasks —
 * no LLM involved, same "never AI-authored" discipline this package
 * applies to financial documents.
 */
export default function OnboardingChecklist({ contactId, tasks }) {
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSeed() {
    setError(null);
    setSeeding(true);

    try {
      const response = await fetch('/api/portal/onboarding-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crm_contact_id: contactId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to seed onboarding tasks.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to seed onboarding tasks.');
    } finally {
      setSeeding(false);
    }
  }

  async function handleComplete(taskId) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/onboarding-tasks/${taskId}/complete`, { method: 'PATCH' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to complete this task.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete this task.');
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Customer Onboarding (CRM)</span>
        <h2>Onboarding checklist.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {tasks.length === 0 ? (
        <div>
          <p className="activity-meta">No onboarding tasks yet.</p>
          <button type="button" className="btn btn-secondary" onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Seeding...' : 'Seed Default Checklist'}
          </button>
        </div>
      ) : (
        <ul className="activity-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">{task.title}</p>
                  <p className="activity-meta">
                    <span className="badge">{task.status}</span>
                  </p>
                </div>
                {task.status !== 'done' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => handleComplete(task.id)}
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
