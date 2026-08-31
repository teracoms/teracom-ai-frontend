'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * TECHNICAL_SUPPORT_OS_MVP_V1 -- "Add Vendor" form ->
 * POST /api/portal/vendor-sources -> POST /vendor-sources/.
 * Deliberately minimal relative to the full VENDOR_KNOWLEDGE_ACQUISITION_
 * SERVICE_V1 (SD-048) design: vendor name, resource URL, and worker only --
 * no department/schedule/auto-approve fields, per
 * Workstreams/TECHNICAL_SUPPORT_OS_MVP_IMPLEMENTATION_PLAN_V1.md §5.
 */
export default function AddVendorSourceForm({ workers }) {
  const { user } = useAuth();
  const router = useRouter();
  const [vendorName, setVendorName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? '');
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
      const response = await fetch('/api/portal/vendor-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: vendorName.trim(),
          resource_url: resourceUrl.trim(),
          worker_id: workerId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to add this vendor source.');
      }

      setVendorName('');
      setResourceUrl('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add this vendor source.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAtLeastRole(user?.role, 'admin')) {
    return <p className="form-note">Only an organisation admin can add a vendor source.</p>;
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
        disabled={loading}
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

      <p className="form-note">
        This worker will be able to answer chat questions from documents discovered here.
      </p>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Vendor'}
      </button>
    </form>
  );
}
