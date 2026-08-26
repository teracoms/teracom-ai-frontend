'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

// SEC_REM_004_AND_PROTECTION_PLATFORM_V1 -- Manual Backups (Workstreams/
// BACKUP_AND_RECOVERY_WORKSTREAM_V1.md §1). Admin-gated, and deliberately
// labelled "Run a platform backup now", not "back up my organisation" --
// this triggers the same real, whole-instance backup the scheduled timer
// runs, covering every organisation on this shared database, not just
// the admin's own.
export default function RunBackupButton() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  if (!isAtLeastRole(user?.role, 'admin')) {
    return null;
  }

  async function handleRun() {
    setError(null);
    setResult(null);
    setRunning(true);

    try {
      const response = await fetch('/api/portal/protection/backup-run', { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to run a backup right now.');
      }

      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run a backup right now.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-secondary btn-small" disabled={running} onClick={handleRun}>
        {running ? 'Running backup...' : 'Run Platform Backup Now'}
      </button>
      <p className="activity-meta" style={{ marginTop: '0.5rem' }}>
        Backs up the whole platform (every organisation), not just yours -- see Recovery below for why.
      </p>
      {result?.status === 'success' && (
        <p className="form-note-banner" role="status">
          Backup completed successfully.
        </p>
      )}
      {result?.status === 'failed' && (
        <p className="form-error" role="alert">
          Backup failed: {result.error_message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
