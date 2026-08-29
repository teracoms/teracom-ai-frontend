'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

function formatBytes(bytes) {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-AU', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function ValidateRestoreResult({ report }) {
  if (report.error) {
    return (
      <p className="form-error" role="alert" style={{ marginTop: '0.5rem' }}>
        {report.error}
      </p>
    );
  }

  if (!report.tenant_binding_valid) {
    return (
      <p className="form-error" role="alert" style={{ marginTop: '0.5rem' }}>
        Archive failed validation: {report.tenant_binding_errors.join('; ')}
      </p>
    );
  }

  return (
    <div className="form-note-banner" role="status" style={{ marginTop: '0.5rem' }}>
      <p>
        {report.workers_total} worker(s) total, {report.pack_derived_total} from a licensed Marketplace pack.
      </p>
      {report.pack_derived_total > 0 && (
        <>
          <p>{report.would_rehydrate.length} would restore in full (your organisation still holds an active licence for that pack).</p>
          {report.would_placeholder.length > 0 && (
            <p>
              {report.would_placeholder.length} would restore with a placeholder role instead of the licensed
              content, since your organisation no longer holds an active licence for that pack:{' '}
              {report.would_placeholder.map((w) => w.pack_slug).join(', ')}.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TenantBackupRow({ record }) {
  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState(null);

  async function handleValidate() {
    setValidating(true);
    setReport(null);

    try {
      const response = await fetch(`/api/portal/protection/tenant-backups/${record.id}/validate-restore`, {
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setReport({ error: data.error || 'Unable to validate this backup right now.' });
      } else {
        setReport(data);
      }
    } catch {
      setReport({ error: 'Unable to validate this backup right now.' });
    } finally {
      setValidating(false);
    }
  }

  return (
    <li>
      <div className="assignment-row">
        <div>
          <p className="activity-title">
            {formatDate(record.started_at)} <span className="badge">{record.status}</span>{' '}
            <span className="badge">{record.kind}</span>
          </p>
          <p className="activity-meta">
            {formatBytes(record.size_bytes)}
            {record.encryption_key_version ? ` · encrypted (${record.encryption_key_version})` : ''}
            {record.error_message ? ` · ${record.error_message}` : ''}
          </p>
        </div>
        {record.status === 'success' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a
              className="btn btn-secondary btn-small"
              href={`/api/portal/protection/tenant-backups/${record.id}/download`}
              download
            >
              Download
            </a>
            <button type="button" className="btn btn-secondary btn-small" disabled={validating} onClick={handleValidate}>
              {validating ? 'Checking…' : 'Validate Restore'}
            </button>
          </div>
        )}
      </div>
      {report && <ValidateRestoreResult report={report} />}
    </li>
  );
}

// TERACOM_PROTECTION_PLATFORM_V1 (SD-041) -- real, tenant-bound,
// encrypted backups the customer can create, list, download, and
// dry-run validate for restore, distinct from RunBackupButton's own
// whole-platform action above it on this page. `initialBackups` is
// server-fetched (same pattern as the rest of this page); this
// component only re-fetches after a real create action, via
// router.refresh(), matching RunBackupButton's own established
// convention exactly.
export default function TenantBackupPanel({ initialBackups }) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  if (!isAtLeastRole(user?.role, 'admin')) {
    return null;
  }

  async function handleCreate(kind) {
    setError(null);
    setCreating(true);

    try {
      const response = await fetch('/api/portal/protection/tenant-backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create a tenant backup right now.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create a tenant backup right now.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <p className="activity-meta">
        A real, encrypted, tenant-bound snapshot of your own organisation only -- never another
        organisation&apos;s data, and any Marketplace pack content is stored as a reference to your
        current licence, never redistributed inside the archive itself.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button type="button" className="btn btn-secondary btn-small" disabled={creating} onClick={() => handleCreate('backup')}>
          {creating ? 'Working…' : 'Back Up My Organisation'}
        </button>
        <button type="button" className="btn btn-secondary btn-small" disabled={creating} onClick={() => handleCreate('export')}>
          {creating ? 'Working…' : 'Create a Downloadable Export'}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert" style={{ marginTop: '0.5rem' }}>
          {error}
        </p>
      )}

      {initialBackups.length === 0 ? (
        <p className="activity-meta" style={{ marginTop: '1rem' }}>
          No tenant backups yet.
        </p>
      ) : (
        <ul className="activity-list" style={{ marginTop: '1rem' }}>
          {initialBackups.map((record) => (
            <TenantBackupRow key={record.id} record={record} />
          ))}
        </ul>
      )}
    </div>
  );
}
