'use client';

import { useRef, useState } from 'react';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Multipart upload → POST /api/portal/knowledge/upload → POST /upload/
 * (worker_id + file; extract-text → create Knowledge row → assign → embed,
 * all server-side in one backend call — see FRONTEND_ARCHITECTURE_V1.md
 * §C.8). Loading-state pattern (useState flag, fetch, try/catch/finally) is
 * the same minimal one used throughout this codebase's client-side
 * data-fetching components.
 *
 * teracom-ai-backend's UploadResponse is `{filename, status}` only — no id
 * of the created document (schemas/upload.py) — so a post-success redirect
 * to the new document's own detail page isn't possible from this response
 * alone. This shows an inline success message and a link back to the list
 * instead of guessing at a redirect target. See
 * KNOWLEDGE_IMPLEMENTATION_REPORT.md §3.
 */
export default function UploadKnowledgeForm({ workers }) {
  const { user } = useAuth();
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const file = fileInputRef.current?.files?.[0];

    if (!workerId) {
      setError('Choose a worker to assign this document to.');
      return;
    }

    if (!file) {
      setError('Choose a file to upload.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('worker_id', workerId);
      formData.set('file', file);

      const response = await fetch('/api/portal/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to upload this document.');
      }

      setSuccess(data);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload this document.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'employee')) {
    return <p className="form-note">You have read-only access and can&apos;t upload knowledge.</p>;
  }

  if (workers.length === 0) {
    return (
      <p className="form-note-banner" role="note">
        You need at least one worker before you can upload knowledge — knowledge is always
        uploaded and assigned to a worker in the same step. Create a worker first, then come
        back here.
      </p>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="form-note-banner" role="status">
          Uploaded &quot;{success.filename}&quot; — {success.status}.
        </p>
      )}

      <select
        value={workerId}
        onChange={(event) => setWorkerId(event.target.value)}
        disabled={loading}
        aria-label="Assign to worker"
      >
        {workers.map((worker) => (
          <option key={worker.id} value={worker.id}>
            {worker.name}
          </option>
        ))}
      </select>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.docx"
        disabled={loading}
        aria-label="Document file"
      />

      <p className="form-note">Accepted: .txt, .pdf, .docx — up to 10MB.</p>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
}
