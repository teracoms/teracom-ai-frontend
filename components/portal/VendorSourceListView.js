'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import EmptyState from '@/components/portal/EmptyState';

/**
 * TECHNICAL_SUPPORT_OS_MVP_V1 -- list + "Scan Now" trigger.
 * No Edit/Remove/Enable-Disable/Schedule controls -- not in the 8-step
 * demo workflow, deferred per
 * Workstreams/TECHNICAL_SUPPORT_OS_MVP_IMPLEMENTATION_PLAN_V1.md §0/§5.
 */
export default function VendorSourceListView({ vendorSources }) {
  const router = useRouter();
  const [scanningId, setScanningId] = useState(null);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  async function handleScanNow(vendorSourceId) {
    setError(null);
    setLastResult(null);
    setScanningId(vendorSourceId);

    try {
      const response = await fetch(`/api/portal/vendor-sources/${vendorSourceId}/scan`, {
        method: 'POST',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to scan this vendor source.');
      }

      setLastResult({ vendorSourceId, ...data });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to scan this vendor source.');
    } finally {
      setScanningId(null);
    }
  }

  if (vendorSources.length === 0) {
    return (
      <EmptyState
        title="No vendor sources yet"
        description="Add a vendor above — its documentation will be discovered, downloaded, and made available to the worker you choose."
      />
    );
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="console-list">
        {vendorSources.map((vendorSource) => {
          const result = lastResult?.vendorSourceId === vendorSource.id ? lastResult : null;

          return (
            <div key={vendorSource.id} className="console-list-item">
              <div>
                <p>
                  <strong>{vendorSource.vendor_name}</strong>{' '}
                  <span className="form-note">{vendorSource.resource_url}</span>
                </p>
                <p className="form-note">
                  Status: {vendorSource.last_scan_status}
                  {' — '}
                  {vendorSource.document_count} ingested
                  {vendorSource.pending_count > 0 ? `, ${vendorSource.pending_count} pending` : ''}
                  {vendorSource.last_scan_at
                    ? ` — last scanned ${new Date(vendorSource.last_scan_at).toLocaleString()}`
                    : ' — never scanned'}
                </p>
                {vendorSource.last_scan_error && (
                  <p className="form-note" role="alert">
                    Last error: {vendorSource.last_scan_error}
                  </p>
                )}
                {result && (
                  <p className="form-note-banner" role="status">
                    Scan complete: {result.discovered} discovered, {result.ingested} newly
                    ingested, {result.skipped} already known, {result.failed} failed.
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={scanningId === vendorSource.id}
                onClick={() => handleScanNow(vendorSource.id)}
              >
                {scanningId === vendorSource.id ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
