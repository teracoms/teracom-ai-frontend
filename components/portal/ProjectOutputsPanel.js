'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ARTIFACT_TYPES = [
  { value: 'docx', label: 'Word Document (DOCX)' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Spreadsheet (XLSX)' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'zip', label: 'ZIP Package' },
  { value: 'source_code', label: 'Source Code' },
  { value: 'other', label: 'Other' },
];

const TYPE_BADGE = {
  docx: 'badge-ok',
  pdf: 'badge-ok',
  xlsx: 'badge-ok',
  image: 'badge-muted',
  video: 'badge-muted',
  zip: 'badge-warn',
  source_code: 'badge-warn',
  other: 'badge-muted',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * OUTPUT_REPOSITORY_IMPLEMENTATION_V1 -- the real, downloadable Output
 * Repository for a project: a list of current-version artifacts, a real
 * upload form (any real file produced for the project -- there is no
 * automated content-generation pipeline behind this yet, see
 * Reports/OUTPUT_REPOSITORY_IMPLEMENTATION_V1.md for what this does and
 * does not cover), version history on demand, real byte-for-byte
 * download, and organisation-wide storage usage visibility.
 */
export default function ProjectOutputsPanel({ projectId, outputs: initialOutputs, storageUsage }) {
  const router = useRouter();
  const [outputs, setOutputs] = useState(initialOutputs);
  const [expandedId, setExpandedId] = useState(null);
  const [versionsByOutput, setVersionsByOutput] = useState({});
  const [loadingVersions, setLoadingVersions] = useState(null);

  const [outputKey, setOutputKey] = useState('');
  const [artifactType, setArtifactType] = useState('other');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpload(event) {
    event.preventDefault();
    const file = event.target.elements.outputFile.files?.[0];

    if (!outputKey.trim()) {
      setError('Give this output a name.');
      return;
    }
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.set('output_key', outputKey.trim());
      formData.set('artifact_type', artifactType);
      if (description.trim()) formData.set('description', description.trim());
      formData.set('file', file);

      const response = await fetch(`/api/portal/projects/${projectId}/outputs`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to upload this output.');
      }

      setOutputs((current) => [data, ...current.filter((item) => item.output_key !== data.output_key)]);
      setOutputKey('');
      setDescription('');
      event.target.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload this output.');
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleVersions(output) {
    if (expandedId === output.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(output.id);

    if (!versionsByOutput[output.id]) {
      setLoadingVersions(output.id);
      try {
        const response = await fetch(`/api/portal/projects/${projectId}/outputs/${output.id}/versions`);
        const data = await response.json().catch(() => []);
        if (response.ok) {
          setVersionsByOutput((current) => ({ ...current, [output.id]: data }));
        }
      } finally {
        setLoadingVersions(null);
      }
    }
  }

  const usedPercent = storageUsage ? storageUsage.used_percent : null;
  const usageTone = usedPercent >= 90 ? 'var(--danger, #ff1717)' : usedPercent >= 75 ? 'var(--warn, #e0a536)' : undefined;

  return (
    <div>
      {storageUsage && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p className="eyebrow">Storage usage</p>
          <p style={{ fontSize: 14, margin: '4px 0' }}>
            {formatBytes(storageUsage.used_bytes)} of {formatBytes(storageUsage.quota_bytes)} used
            {usageTone && (
              <span style={{ color: usageTone, marginLeft: 8 }}>({usedPercent}%)</span>
            )}
          </p>
          <div style={{ background: 'rgba(128,128,128,0.2)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(usedPercent, 100)}%`,
                background: usageTone || 'var(--ok, #3ecf8e)',
                height: '100%',
              }}
            />
          </div>
        </div>
      )}

      <div className="section-heading left">
        <span className="eyebrow">Outputs</span>
        <h3>Add a project deliverable.</h3>
      </div>
      <p className="form-note">
        DOCX, PDF, XLSX, images, video, ZIP packages, source code, or any other file the project has
        produced. Uploading with the same name as an existing output adds a new version, rather than
        replacing it.
      </p>

      <form className="contact-form" onSubmit={handleUpload} noValidate>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <input
          type="text"
          value={outputKey}
          onChange={(event) => setOutputKey(event.target.value)}
          placeholder="Output name, e.g. Requirements Spec"
          disabled={uploading}
          aria-label="Output name"
        />
        <select value={artifactType} onChange={(event) => setArtifactType(event.target.value)} disabled={uploading} aria-label="Output type">
          {ARTIFACT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
          disabled={uploading}
          aria-label="Description"
        />
        <input type="file" name="outputFile" disabled={uploading} aria-label="Output file" />
        <button className="btn btn-primary" type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Output'}
        </button>
      </form>

      {outputs.length === 0 ? (
        <p className="activity-meta" style={{ marginTop: '1.5rem' }}>No outputs yet.</p>
      ) : (
        <ul className="activity-list" style={{ marginTop: '1.5rem' }}>
          {outputs.map((output) => (
            <li key={output.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {output.filename} <span className={`badge ${TYPE_BADGE[output.artifact_type] || 'badge-muted'}`}>{output.artifact_type}</span>{' '}
                    <span className="badge badge-muted">v{output.version}</span>
                  </p>
                  {output.description && <p className="activity-meta">{output.description}</p>}
                  <p className="activity-meta">
                    {formatBytes(output.size_bytes)} · {formatDate(output.created_at)}
                  </p>
                </div>
                <div>
                  <a className="btn btn-primary btn-small" href={`/api/portal/projects/${projectId}/outputs/${output.id}/download`}>
                    Download
                  </a>{' '}
                  {output.version > 1 && (
                    <button type="button" className="btn btn-secondary btn-small" onClick={() => handleToggleVersions(output)}>
                      {expandedId === output.id ? 'Hide Versions' : 'View Versions'}
                    </button>
                  )}
                </div>
              </div>

              {expandedId === output.id && (
                <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                  {loadingVersions === output.id ? (
                    <p className="activity-meta">Loading versions...</p>
                  ) : (
                    (versionsByOutput[output.id] || []).map((version) => (
                      <div key={version.id} className="activity-meta" style={{ marginBottom: '0.25rem' }}>
                        v{version.version} — {formatBytes(version.size_bytes)} — {formatDate(version.created_at)}
                        {version.description ? ` — ${version.description}` : ''}{' '}
                        <a href={`/api/portal/projects/${projectId}/outputs/${version.id}/download`}>Download</a>
                      </div>
                    ))
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
