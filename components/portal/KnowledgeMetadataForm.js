'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DOCUMENT_TYPES = ['policy', 'pricing_reference', 'case_study', 'template', 'general'];
const SENSITIVITY_LEVELS = ['public', 'internal', 'confidential'];

/**
 * Metadata Foundation ("Package META1") — document_type, sensitivity_level,
 * and tags were real backend-side (schemas/knowledge.py,
 * services/metadata_service.py) but had zero frontend surface anywhere: no
 * way to set them at upload, no way to view or edit them after. Read-open
 * (any org member sees the current classification); write is admin-only,
 * matching PATCH /knowledge/{id}/metadata's own gate.
 *
 * document_type/sensitivity_level can only ever be set to one of their
 * closed values, never explicitly cleared back to "unset" once chosen —
 * services/metadata_service.py#set_knowledge_metadata() only checks
 * `is not None` per field, so there is no real backend path to unset
 * either one again. This form doesn't offer a false "clear" option for
 * them; only `tags` has a genuine clear path (submitting an empty list).
 */
export default function KnowledgeMetadataForm({ documentId, metadata, canEdit }) {
  const [documentType, setDocumentType] = useState(metadata?.document_type ?? '');
  const [sensitivityLevel, setSensitivityLevel] = useState(metadata?.sensitivity_level ?? '');
  const [tagsInput, setTagsInput] = useState((metadata?.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();

    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/portal/knowledge/${documentId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: documentType || undefined,
          sensitivity_level: sensitivityLevel || undefined,
          tags: tagsInput
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update this document's classification.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this document's classification.");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <ul className="activity-list">
        <li>
          <div className="assignment-row">
            <span className="activity-title">Document type</span>
            <span className="activity-meta">
              {metadata?.document_type ? metadata.document_type.replace(/_/g, ' ') : 'Unclassified'}
            </span>
          </div>
        </li>
        <li>
          <div className="assignment-row">
            <span className="activity-title">Sensitivity</span>
            <span className="activity-meta">{metadata?.sensitivity_level ?? 'Unclassified'}</span>
          </div>
        </li>
        <li>
          <div className="assignment-row">
            <span className="activity-title">Tags</span>
            <span className="activity-meta">
              {metadata?.tags?.length ? metadata.tags.join(', ') : 'None'}
            </span>
          </div>
        </li>
      </ul>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <select
        value={documentType}
        onChange={(event) => setDocumentType(event.target.value)}
        disabled={saving}
        aria-label="Document type"
      >
        <option value="" disabled={Boolean(documentType)}>
          Unclassified
        </option>
        {DOCUMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      <select
        value={sensitivityLevel}
        onChange={(event) => setSensitivityLevel(event.target.value)}
        disabled={saving}
        aria-label="Sensitivity level"
      >
        <option value="" disabled={Boolean(sensitivityLevel)}>
          Unclassified
        </option>
        {SENSITIVITY_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={tagsInput}
        onChange={(event) => setTagsInput(event.target.value)}
        placeholder="Tags, comma-separated (e.g. onboarding, pricing)"
        disabled={saving}
        aria-label="Tags"
      />

      <button className="btn btn-primary btn-small" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Classification'}
      </button>

      {(documentType || sensitivityLevel) && (
        <p className="form-note">
          Document type and sensitivity can be set or changed, but not cleared back to
          &quot;Unclassified&quot; once chosen.
        </p>
      )}
    </form>
  );
}
