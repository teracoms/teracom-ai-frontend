'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalSupportRequestThread({ request, messages }) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!body.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/customer-portal/support-requests/${request.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send this message.');
      }

      setBody('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send this message.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">{request.request_type}</span>
        <h2>
          {request.subject} <span className="badge">{request.status}</span>
        </h2>
        <p>{request.description}</p>
      </div>

      {(!messages || messages.length === 0) ? (
        <p className="activity-meta">No messages yet.</p>
      ) : (
        <ul className="activity-list">
          {messages.map((message) => (
            <li key={message.id}>
              <p className="activity-title">{message.sender_type === 'portal_contact' ? 'You' : 'Support team'}</p>
              <p className="activity-meta">{message.body}</p>
              <p className="activity-meta">{new Date(message.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a reply..."
          disabled={submitting}
          aria-label="Reply"
        />
        <button className="btn btn-primary" type="submit" disabled={submitting || !body.trim()}>
          {submitting ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
