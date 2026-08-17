'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Phase 0 Package O, objective #12 — staff-facing support request
 * list, status control, and reply thread. Reused on both
 * ContactDetailPage (this contact's own requests) and the org-wide
 * /portal/support inbox (every request, `showContactColumn`).
 * Ungated — any org member, mirrors Package N's Task/Project posture.
 */
export default function SupportRequestPanel({ requests, showContactColumn = false }) {
  const [expandedId, setExpandedId] = useState(null);
  const [messagesById, setMessagesById] = useState({});
  const [replyBody, setReplyBody] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  async function toggleExpand(request) {
    if (expandedId === request.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(request.id);
    setReplyBody('');

    if (!messagesById[request.id]) {
      try {
        const response = await fetch(`/api/portal/support-requests/${request.id}/messages`);
        const data = await response.json().catch(() => []);
        setMessagesById((prev) => ({ ...prev, [request.id]: Array.isArray(data) ? data : [] }));
      } catch {
        setMessagesById((prev) => ({ ...prev, [request.id]: [] }));
      }
    }
  }

  async function handleStatusChange(requestId, status) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/support-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this request's status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this request's status.");
    }
  }

  async function handleReply(requestId) {
    if (!replyBody.trim()) return;
    setError(null);

    try {
      const response = await fetch(`/api/portal/support-requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send this reply.');
      }

      setMessagesById((prev) => ({ ...prev, [requestId]: [...(prev[requestId] ?? []), data] }));
      setReplyBody('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send this reply.');
    }
  }

  if (!requests || requests.length === 0) {
    return <p className="activity-meta">No support requests.</p>;
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <ul className="activity-list">
        {requests.map((request) => (
          <li key={request.id}>
            <div className="assignment-row">
              <div>
                <p className="activity-title">
                  {request.subject} <span className="badge">{request.request_type}</span>{' '}
                  <span className="badge">{request.status}</span>
                </p>
                {showContactColumn && <p className="activity-meta">Contact: {request.crm_contact_id}</p>}
                <p className="activity-meta">{request.description}</p>
              </div>
              <div>
                <select
                  value={request.status}
                  onChange={(event) => handleStatusChange(request.id, event.target.value)}
                  aria-label={`Status for ${request.subject}`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>{' '}
                <button type="button" className="btn btn-secondary btn-small" onClick={() => toggleExpand(request)}>
                  {expandedId === request.id ? 'Hide Thread' : 'View Thread'}
                </button>
              </div>
            </div>

            {expandedId === request.id && (
              <div>
                {(messagesById[request.id] ?? []).length === 0 ? (
                  <p className="activity-meta">No messages yet.</p>
                ) : (
                  <ul className="activity-list">
                    {messagesById[request.id].map((message) => (
                      <li key={message.id}>
                        <p className="activity-title">
                          {message.sender_type === 'portal_contact' ? 'Customer' : 'Staff'}
                        </p>
                        <p className="activity-meta">{message.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  className="contact-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleReply(request.id);
                  }}
                  noValidate
                >
                  <textarea
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write a reply..."
                    aria-label="Reply"
                  />
                  <button className="btn btn-primary btn-small" type="submit" disabled={!replyBody.trim()}>
                    Send
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
