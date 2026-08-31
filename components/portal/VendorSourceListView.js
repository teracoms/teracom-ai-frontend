'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import EmptyState from '@/components/portal/EmptyState';
import VendorSourceForm from '@/components/portal/VendorSourceForm';

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- full CRUD list view,
 * replacing the MVP's Add/List/Scan-only surface. Grouped client-side by
 * vendor_name (no schema change: multiple resource URLs per vendor are
 * already just multiple VendorSource rows sharing one name) so "Add
 * another URL" reads naturally under an existing vendor rather than as a
 * second, unrelated entry.
 */
export default function VendorSourceListView({ vendorSources, workers }) {
  const router = useRouter();
  const [scanningId, setScanningId] = useState(null);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addingUrlFor, setAddingUrlFor] = useState(null);
  const [removingId, setRemovingId] = useState(null);

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

  async function handleToggleEnabled(vendorSource) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/vendor-sources/${vendorSource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !vendorSource.enabled }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update this vendor source.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this vendor source.');
    }
  }

  async function handleRemove(vendorSourceId) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/vendor-sources/${vendorSourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removed: true }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to remove this vendor source.');
      }

      setRemovingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove this vendor source.');
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

  const groups = new Map();
  for (const vendorSource of vendorSources) {
    const key = vendorSource.vendor_name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(vendorSource);
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {[...groups.entries()].map(([vendorName, sources]) => (
        <div key={vendorName} className="console-list" style={{ marginBottom: 24 }}>
          <h3>{vendorName}</h3>

          {sources.map((vendorSource) => {
            const result = lastResult?.vendorSourceId === vendorSource.id ? lastResult : null;

            return (
              <div key={vendorSource.id} className="console-row" style={{ alignItems: "flex-start" }}>
                {editingId === vendorSource.id ? (
                  <div style={{ flex: 1 }}>
                    <VendorSourceForm
                      workers={workers}
                      vendorSource={vendorSource}
                      onDone={() => setEditingId(null)}
                    />
                    <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p>
                        <span className="form-note">{vendorSource.resource_url}</span>{' '}
                        {!vendorSource.enabled && <span className="badge">Disabled</span>}
                      </p>
                      <p className="form-note">
                        Status: {vendorSource.last_scan_status}
                        {' — '}
                        {vendorSource.document_count} ingested
                        {vendorSource.pending_count > 0 ? `, ${vendorSource.pending_count} pending` : ''}
                        {vendorSource.changed_count > 0 ? `, ${vendorSource.changed_count} superseded` : ''}
                        {vendorSource.failed_count > 0 ? `, ${vendorSource.failed_count} failed` : ''}
                        {' — scans '}
                        {vendorSource.schedule_interval === 'manual' ? 'manually' : vendorSource.schedule_interval}
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
                          ingested, {result.changed ?? 0} changed, {result.skipped} already known,{' '}
                          {result.failed} failed.
                        </p>
                      )}
                      <Link
                        className="btn btn-secondary btn-small"
                        href={`/portal/operating-systems/technical-support/vendor-sources/${vendorSource.id}/documents`}
                      >
                        View documents &amp; versions
                      </Link>
                    </div>
                    <div className="console-row-actions" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        disabled={scanningId === vendorSource.id || !vendorSource.enabled}
                        onClick={() => handleScanNow(vendorSource.id)}
                      >
                        {scanningId === vendorSource.id ? 'Scanning...' : 'Scan Now'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setEditingId(vendorSource.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => handleToggleEnabled(vendorSource)}
                      >
                        {vendorSource.enabled ? 'Disable' : 'Enable'}
                      </button>
                      {removingId === vendorSource.id ? (
                        <>
                          <span className="form-note">
                            Remove? Already-ingested documents are kept — only future scanning
                            stops.
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => handleRemove(vendorSource.id)}
                          >
                            Confirm Remove
                          </button>
                          <button type="button" className="btn btn-secondary btn-small" onClick={() => setRemovingId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => setRemovingId(vendorSource.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {addingUrlFor === vendorName ? (
            <div className="console-row" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <VendorSourceForm
                  workers={workers}
                  defaultVendorName={vendorName}
                  onDone={() => setAddingUrlFor(null)}
                />
                <button type="button" className="btn btn-secondary btn-small" onClick={() => setAddingUrlFor(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setAddingUrlFor(vendorName)}>
              + Add another URL for {vendorName}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
