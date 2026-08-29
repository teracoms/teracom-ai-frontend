'use client';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

// PLATFORM_PROTECTION_CAPABILITY_V1 -- "Tenant restore" made real,
// self-service half: a genuine per-organisation export, unlike
// RunBackupButton's own whole-platform action above it on this page. A
// plain <a download> against the same-origin proxy route -- the
// browser's own session cookie carries auth, and the route sets
// Content-Disposition: attachment, so this needs no client-side fetch/
// blob handling to trigger a real file save.
export default function TenantExportButton() {
  const { user } = useAuth();

  if (!isAtLeastRole(user?.role, 'admin')) {
    return null;
  }

  return (
    <div>
      <a
        className="btn btn-secondary btn-small"
        href="/api/portal/protection/tenant-export"
        download
      >
        Download My Organisation&apos;s Data
      </a>
      <p className="activity-meta" style={{ marginTop: '0.5rem' }}>
        A real, restorable snapshot of your own organisation only -- Workers, Knowledge, Memory,
        Projects, Conversations, Outputs, and Governance. Does not include billing/licensing.
      </p>
    </div>
  );
}
