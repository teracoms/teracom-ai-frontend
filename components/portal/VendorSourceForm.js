'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual (Scan Now only)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- one shared form backing both
 * Add Vendor (POST) and Edit Vendor (PATCH), mirroring the backend's own
 * "one shared PATCH endpoint" shape (781cfe3). Pass `vendorSource` to open
 * in edit mode, pre-filled; omit it for a fresh Add form. `defaultVendorName`
 * pre-fills the vendor name field only (read-only) for the "Add another URL"
 * flow under an existing vendor group -- a genuinely new VendorSource row
 * sharing an existing vendor_name, not a schema change (multiple resource
 * URLs per vendor is already just multiple rows with the same vendor_name).
 */
export default function VendorSourceForm({ workers, vendorSource = null, defaultVendorName = '', onDone }) {
  const { user } = useAuth();
  const router = useRouter();
  const isEdit = Boolean(vendorSource);

  const [vendorName, setVendorName] = useState(vendorSource?.vendor_name ?? defaultVendorName);
  const [resourceUrl, setResourceUrl] = useState(vendorSource?.resource_url ?? '');
  const [workerId, setWorkerId] = useState(vendorSource?.worker_id ?? workers[0]?.id ?? '');
  const [scheduleInterval, setScheduleInterval] = useState(vendorSource?.schedule_interval ?? 'manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!vendorName.trim() || !resourceUrl.trim() || !workerId) {
      setError('Vendor name, resource URL, and worker are all required.');
      return;
    }

    if (!resourceUrl.trim().startsWith('https://')) {
      setError('Resource URL must start with https://');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const url = isEdit ? `/api/portal/vendor-sources/${vendorSource.id}` : '/api/portal/vendor-sources';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit
        ? {
            vendor_name: vendorName.trim(),
            resource_url: resourceUrl.trim(),
            worker_id: workerId,
            schedule_interval: scheduleInterval,
          }
        : {
            vendor_name: vendorName.trim(),
            resource_url: resourceUrl.trim(),
            worker_id: workerId,
            schedule_interval: scheduleInterval,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Unable to ${isEdit ? 'update' : 'add'} this vendor source.`);
      }

      if (!isEdit) {
        setVendorName('');
        setResourceUrl('');
      }

      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${isEdit ? 'update' : 'add'} this vendor source.`);
    } finally {
      setLoading(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'admin')) {
    return <p className="form-note">Only an organisation admin can {isEdit ? 'edit' : 'add'} a vendor source.</p>;
  }

  if (workers.length === 0) {
    return (
      <p className="form-note-banner" role="note">
        You need at least one worker before adding a vendor source — the worker you choose is
        who will be able to answer questions from this vendor&apos;s documents. Create a worker
        first, then come back here.
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

      <input
        type="text"
        placeholder="Vendor name (e.g. Aritech)"
        value={vendorName}
        onChange={(event) => setVendorName(event.target.value)}
        disabled={loading || Boolean(defaultVendorName)}
        aria-label="Vendor name"
      />

      <input
        type="url"
        placeholder="Resource URL (e.g. https://aritech.com.au/resources/)"
        value={resourceUrl}
        onChange={(event) => setResourceUrl(event.target.value)}
        disabled={loading}
        aria-label="Resource URL"
      />

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

      <select
        value={scheduleInterval}
        onChange={(event) => setScheduleInterval(event.target.value)}
        disabled={loading}
        aria-label="Scan frequency"
      >
        {SCHEDULE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <p className="form-note">
        This worker will be able to answer chat questions from documents discovered here.
        {scheduleInterval === 'manual'
          ? ' Manual scans only — use "Scan Now" whenever you want to check for new documents.'
          : ` Scheduling is configured now; no recurring scan job runs automatically yet — use "Scan Now" in the meantime.`}
      </p>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? (isEdit ? 'Saving...' : 'Adding...') : isEdit ? 'Save Changes' : 'Add Vendor'}
      </button>
    </form>
  );
}
