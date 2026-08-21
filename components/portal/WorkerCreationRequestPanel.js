'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Worker Lifecycle & Governance (Phase 0 Package PQR, objectives
 * #1-#3) — a second, optional path to a real Worker, alongside the
 * pre-existing direct admin creation (/portal/workers/new, unchanged).
 * Mirrors DepartmentBudgetPanel's submit -> admin-decide shape.
 * Approval creates a real Worker row; rejection creates none.
 */
export default function WorkerCreationRequestPanel({ requests }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [purpose, setPurpose] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !role.trim() || !purpose.trim() || !instructions.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/worker-creation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          purpose: purpose.trim(),
          instructions: instructions.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this request.');
      }

      setName('');
      setRole('');
      setPurpose('');
      setInstructions('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(requestId, decision) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/worker-creation-requests/${requestId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to record this decision.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record this decision.');
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Worker Requests</span>
        <h2>Propose a new worker.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!isAtLeastRole(user?.role, 'employee') ? (
        <p className="form-note">You have read-only access and can&apos;t propose a worker.</p>
      ) : (
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Worker name"
          disabled={submitting}
          aria-label="Worker name"
        />
        <input
          type="text"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Role"
          disabled={submitting}
          aria-label="Role"
        />
        <textarea
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          placeholder="Purpose"
          disabled={submitting}
          aria-label="Purpose"
        />
        <textarea
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          placeholder="Instructions"
          disabled={submitting}
          aria-label="Instructions"
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || !name.trim() || !role.trim() || !purpose.trim() || !instructions.trim()}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
      )}

      {(!requests || requests.length === 0) ? (
        <p className="activity-meta">No worker creation requests yet.</p>
      ) : (
        <ul className="activity-list">
          {requests.map((request) => (
            <li key={request.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {request.name} <span className="badge">{request.status}</span>
                  </p>
                  <p className="activity-meta">{request.role}</p>
                </div>
                {request.status === 'submitted' && isAtLeastRole(user?.role, 'admin') && (
                  <div>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => handleDecide(request.id, 'approved')}
                    >
                      Approve
                    </button>{' '}
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => handleDecide(request.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
