'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

const ENDPOINTS = {
  proposal: { submit: '/api/portal/proposals', decide: (id) => `/api/portal/proposals/${id}/decide` },
  quote: { submit: '/api/portal/quotes', decide: (id) => `/api/portal/quotes/${id}/decide` },
  contract: { submit: '/api/portal/contracts', decide: (id) => `/api/portal/contracts/${id}/decide` },
};

const LABELS = { proposal: 'Proposal', quote: 'Quote', contract: 'Contract' };

/**
 * Phase 0 Package M — an inline internal-cost-estimate control for a
 * single proposal, distinct from and alongside the customer-facing
 * `amount` field. Not a pricing decision, so no admin gate — any org
 * member may set it.
 */
function ProposalCostEstimateField({ proposal, onSaved }) {
  const [value, setValue] = useState(proposal.internal_cost_estimate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    if (value === '' || Number.isNaN(Number(value))) return;

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/portal/proposals/${proposal.id}/cost-estimate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_cost_estimate: Number(value) }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this proposal's cost estimate.");
      }

      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this proposal's cost estimate.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <input
        type="number"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Internal cost estimate"
        disabled={saving}
        aria-label={`Internal cost estimate for ${proposal.title}`}
      />{' '}
      <button type="button" className="btn btn-secondary btn-small" onClick={handleSave} disabled={saving || value === ''}>
        {saving ? 'Saving...' : 'Save Cost Estimate'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Phase 0 Package J — one shared component for all three approval-gated
 * document kinds (proposal/quote/contract), parametrised by `{kind,
 * contactId}` — the same "one shared component, not three near-duplicates"
 * precedent MemorySummaryPanel already established in Package H. Only
 * `kind="proposal"` gets the "Draft with AI" affordance — quotes/contracts
 * are always human-entered (see lib/api/dealDocuments.js). Decide
 * (approve/reject) buttons only render for an admin — a presentation-layer
 * convenience, the real gate is backend-side. `kind="proposal"` rows also
 * get a `ProposalCostEstimateField` (Phase 0 Package M) — an internal
 * cost-to-deliver figure, distinct from the customer-facing `amount`.
 */
export default function DealDocumentPanel({ kind, contactId, documents, workers }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');
  const [brief, setBrief] = useState('');
  const [workerId, setWorkerId] = useState(workers?.[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const endpoints = ENDPOINTS[kind];
  const label = LABELS[kind];

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(endpoints.submit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crm_contact_id: contactId,
          title: title.trim(),
          content: content.trim(),
          amount: amount ? Number(amount) : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Unable to submit this ${label.toLowerCase()}.`);
      }

      setTitle('');
      setContent('');
      setAmount('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to submit this ${label.toLowerCase()}.`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDraft() {
    if (!title.trim() || !brief.trim() || !workerId) return;

    setError(null);
    setDrafting(true);

    try {
      const response = await fetch('/api/portal/proposals/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crm_contact_id: contactId,
          title: title.trim(),
          brief: brief.trim(),
          worker_id: workerId,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to draft this proposal.');
      }

      setContent(data.content);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to draft this proposal.');
    } finally {
      setDrafting(false);
    }
  }

  async function handleDecide(documentId, decision) {
    setError(null);

    try {
      const response = await fetch(endpoints.decide(documentId), {
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

  async function handleSubmitDraft(documentId) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/proposals/${documentId}/submit`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this proposal.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this proposal.');
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">{label}s</span>
        <h2>{label} management.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={`${label} title`}
          disabled={submitting}
          aria-label={`${label} title`}
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={`${label} content`}
          disabled={submitting}
          aria-label={`${label} content`}
          rows={4}
        />
        <input
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount (optional)"
          disabled={submitting}
          aria-label="Amount"
        />

        {kind === 'proposal' && workers?.length > 0 && (
          <div>
            <select
              value={workerId}
              onChange={(event) => setWorkerId(event.target.value)}
              disabled={drafting}
              aria-label="Drafting worker"
            >
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Brief for AI draft"
              disabled={drafting}
              aria-label="Draft brief"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDraft}
              disabled={drafting || !title.trim() || !brief.trim()}
            >
              {drafting ? 'Drafting...' : 'Draft with AI'}
            </button>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting || !title.trim() || !content.trim()}>
          {submitting ? 'Submitting...' : `Submit ${label}`}
        </button>
      </form>

      {(!documents || documents.length === 0) ? (
        <p className="activity-meta">No {label.toLowerCase()}s yet.</p>
      ) : (
        <ul className="activity-list">
          {documents.map((document) => (
            <li key={document.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {document.title} <span className="badge">{document.status}</span>
                  </p>
                  <p className="activity-meta">{document.content}</p>
                  {document.amount != null && <p className="activity-meta">Amount: {document.amount}</p>}
                  {kind === 'proposal' && document.internal_cost_estimate != null && (
                    <p className="activity-meta">Internal cost estimate: {document.internal_cost_estimate}</p>
                  )}
                  {kind === 'proposal' && (
                    <ProposalCostEstimateField proposal={document} onSaved={() => router.refresh()} />
                  )}
                </div>
                <div>
                  {document.status === 'draft' && kind === 'proposal' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => handleSubmitDraft(document.id)}
                    >
                      Submit
                    </button>
                  )}
                  {document.status === 'submitted' && isAtLeastRole(user?.role, 'admin') && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => handleDecide(document.id, 'approved')}
                      >
                        Approve
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => handleDecide(document.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
