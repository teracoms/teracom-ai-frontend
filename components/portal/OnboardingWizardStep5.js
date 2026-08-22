'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import ConceptHelp from '@/components/portal/ConceptHelp';
import { useAuth } from '@/components/portal/AuthProvider';
import { KNOWLEDGE_CATEGORIES, knowledgeCategoryLabel } from '@/lib/knowledgeCategories';

const EMPTY_FORM = { title: '', content: '', source: '', document_type: '' };

// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 5 -- Knowledge Setup. Reuses
// the pre-existing POST /api/portal/knowledge proxy (organisation-
// scoped, text-based creation with document_type set in the same
// call) -- distinct from the worker-scoped file-upload flow
// (POST /api/portal/knowledge/upload) that /portal/knowledge/upload
// already uses; the wizard's own Knowledge Setup is an organisation-
// level concept, matching every other step so far.
export default function OnboardingWizardStep5({ initialKnowledge, stepAlreadyCompleted }) {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState(initialKnowledge);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [completed, setCompleted] = useState(stepAlreadyCompleted);

  function pickCategory(category) {
    setSelectedCategory(category.key);
    setForm((prev) => ({ ...prev, document_type: category.key }));
  }

  async function markStepComplete() {
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 5 }),
      });
      setCompleted(true);
    } catch {
      // Non-fatal -- see OnboardingWizardStep2's own identical note.
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();
    const source = form.source.trim();
    if (!title || !content || !source) return;

    setCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/portal/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          source,
          document_type: form.document_type || undefined,
          organisation_id: user?.organisation_id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to create this knowledge document.');

      setDocuments((prev) => [...prev, data]);
      setForm(EMPTY_FORM);
      setSelectedCategory(null);
      await markStepComplete();
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create this knowledge document.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="wizard-step5">
      <div className="section-heading left">
        <span className="eyebrow">Knowledge Setup</span>
        <h2>
          Knowledge <ConceptHelp concept="knowledge" />
        </h2>
        <p className="activity-meta">
          Knowledge is what makes a Worker useful for your organisation specifically, not just
          generally capable. Workers only see the Knowledge they&apos;ve actually been assigned{' '}
          <ConceptHelp concept="knowledgeAssignment" /> — uploading a document here doesn&apos;t
          automatically hand it to every Worker.
        </p>
      </div>

      {completed && (
        <p className="form-note-banner" role="status">
          Knowledge setup saved. Add more documents any time — this step stays available after
          setup.
        </p>
      )}

      <div className="wizard-step5-categories">
        <p className="activity-meta">Choose a category, or fill in your own document below.</p>
        <div className="wizard-step5-category-grid">
          {KNOWLEDGE_CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.key}
              className={'wizard-step5-category-card' + (selectedCategory === category.key ? ' selected' : '')}
              onClick={() => pickCategory(category)}
            >
              <span className="wizard-step5-category-name">{category.label}</span>
              <span className="wizard-step5-category-desc">{category.description}</span>
            </button>
          ))}
        </div>
      </div>

      <form className="contact-form" onSubmit={handleCreate} noValidate>
        {createError && (
          <p className="form-error" role="alert">
            {createError}
          </p>
        )}

        <div>
          <label htmlFor="wizard-knowledge-title">Title</label>
          <input
            id="wizard-knowledge-title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Refund Policy"
            disabled={creating}
          />
        </div>

        <div>
          <label htmlFor="wizard-knowledge-category">Category</label>
          <select
            id="wizard-knowledge-category"
            value={form.document_type}
            onChange={(event) => {
              setForm({ ...form, document_type: event.target.value });
              setSelectedCategory(event.target.value || null);
            }}
            disabled={creating}
          >
            <option value="">Unclassified</option>
            {KNOWLEDGE_CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="wizard-knowledge-content">Content</label>
          <textarea
            id="wizard-knowledge-content"
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            placeholder="Paste or write the document's content."
            disabled={creating}
            rows={5}
          />
        </div>

        <div>
          <label htmlFor="wizard-knowledge-source">Source</label>
          <input
            id="wizard-knowledge-source"
            value={form.source}
            onChange={(event) => setForm({ ...form, source: event.target.value })}
            placeholder="e.g. wizard, upload, internal wiki"
            disabled={creating}
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={creating || !form.title.trim() || !form.content.trim() || !form.source.trim()}
        >
          {creating ? 'Creating...' : 'Add Knowledge Document'}
        </button>
      </form>

      {documents.length > 0 && (
        <ul className="wizard-step5-doc-list">
          {documents.map((doc) => (
            <li key={doc.id} className="wizard-step5-doc-item">
              <span className="wizard-step5-doc-title">{doc.title}</span>
              <span className="wizard-step5-doc-tag">
                {doc.document_type ? knowledgeCategoryLabel(doc.document_type) : 'Unclassified'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
