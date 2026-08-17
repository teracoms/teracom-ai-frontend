'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Objectives #7/#8 — support request and incident submission + list.
 * Submitting request_type "incident" automatically creates an Operations
 * Task backend-side (governance: "incident reports create operations
 * workflows") — no deployment or infrastructure action is ever triggered.
 */
export default function PortalSupportRequestList({ requests }) {
  const [requestType, setRequestType] = useState('support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/customer-portal/support-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: requestType,
          subject: subject.trim(),
          description: description.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this request.');
      }

      setSubject('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <select
          value={requestType}
          onChange={(event) => setRequestType(event.target.value)}
          disabled={submitting}
          aria-label="Request type"
        >
          <option value="support">General support</option>
          <option value="incident">Incident report</option>
        </select>
        <input
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Subject"
          disabled={submitting}
          aria-label="Subject"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe your request..."
          disabled={submitting}
          aria-label="Description"
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || !subject.trim() || !description.trim()}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {(!requests || requests.length === 0) ? (
        <p className="activity-meta">No support requests yet.</p>
      ) : (
        <ul className="activity-list">
          {requests.map((request) => (
            <li key={request.id}>
              <Link href={`/customer-portal/support/${request.id}`}>
                <p className="activity-title">
                  {request.subject} <span className="badge">{request.status}</span>
                </p>
                <p className="activity-meta">{request.request_type}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
