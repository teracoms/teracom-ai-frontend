'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EXAMPLES = [
  'I want to create a CRM',
  'I need a website',
  'I need a proposal',
  'I need a marketing campaign',
  'I need documentation',
];

// CUSTOMER_EXPERIENCE_REDESIGN_V1 -- the Initiative flow. One input, no
// task/worker/priority/due-date fields shown -- POST /api/portal/initiative
// picks a worker and creates the project (with auto-generated tasks when
// the account's tier allows it) entirely behind this one submission.
export default function InitiativeForm() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = goal.trim();
    if (!text || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/initiative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: text }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to start this initiative.');
      }

      router.push(`/portal/workspace/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start this initiative.');
      setSubmitting(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <textarea
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        placeholder="I want to create a CRM"
        disabled={submitting}
        aria-label="What would you like Teracom AI to do?"
        rows={3}
        autoFocus
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary" type="submit" disabled={submitting || !goal.trim()}>
        {submitting ? 'Starting...' : 'Start Initiative'}
      </button>

      <p className="form-note">
        For example: {EXAMPLES.map((example, index) => (
          <span key={example}>
            <button
              type="button"
              onClick={() => setGoal(example)}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                color: 'inherit',
                textDecoration: 'underline',
                cursor: submitting ? 'default' : 'pointer',
              }}
            >
              &ldquo;{example}&rdquo;
            </button>
            {index < EXAMPLES.length - 1 ? ', ' : ''}
          </span>
        ))}
      </p>
    </form>
  );
}
