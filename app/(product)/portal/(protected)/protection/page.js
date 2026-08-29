import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import {
  fetchProtectionDashboard,
  fetchStorageVisibility,
  fetchBackupHistory,
  fetchTenantBackups,
} from '@/lib/api/protection';
import { settle, errorMessage, isForbidden } from '@/lib/api/results';
import RunBackupButton from '@/components/portal/RunBackupButton';
import TenantExportButton from '@/components/portal/TenantExportButton';
import TenantBackupPanel from '@/components/portal/TenantBackupPanel';

export const metadata = {
  title: 'Protection | Teracom AI Portal',
};

function formatBytes(bytes) {
  if (bytes == null) return '—';
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

function StatusTile({ eyebrow, title, children, tone }) {
  return (
    <div className={tone ? `stat-tile status-${tone}` : 'stat-tile'}>
      <span className="eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// SEC_REM_004_AND_PROTECTION_PLATFORM_V1 -- Architecture/
// AI_ORGANISATION_EXPERIENCE_REQUIREMENTS_V1.md §13-§18's Protection
// capability, the fifth peer alongside People/Conversations/Projects/
// Outputs. Every tile below renders exactly what GET /protection/dashboard
// and GET /protection/storage return -- no client-side fabrication of a
// score, a green light, or a figure the backend didn't compute. Where the
// backend's own answer is an honest "no" (Encryption/Backup/Recovery/
// Compliance/Protection Score, per that document's own §15.2), this page
// shows that "no" plainly, matching this whole product's established
// "don't fabricate" discipline (Billing & Licensing's illustrative-data
// banner, the Orchestrator's clarification-seeking prompt, etc.).
export default async function ProtectionPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Protection</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');

  const [dashboardSettled, storageSettled, historySettled, tenantBackupsSettled] = await Promise.allSettled([
    fetchProtectionDashboard(token),
    fetchStorageVisibility(token),
    isAdmin ? fetchBackupHistory(token) : Promise.resolve([]),
    isAdmin ? fetchTenantBackups(token) : Promise.resolve([]),
  ]);

  const dashboardResult = settle(dashboardSettled);
  const storageResult = settle(storageSettled);
  const historyResult = settle(historySettled);
  const tenantBackupsResult = settle(tenantBackupsSettled);

  if (dashboardResult.error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Protection</span>
            <p className="form-error" role="alert">
              {errorMessage(dashboardResult.error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const dashboard = dashboardResult.value;

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Protection</span>
            <h1>What&apos;s protecting your organisation, honestly.</h1>
            <p className="lead">
              Conversations, Requirements, Projects, Outputs, Knowledge, Memory, Policies,
              Procedures, and Organisational Learning -- not a database. Every figure below is
              real, live-checked, and shown plainly when the honest answer is &quot;not yet.&quot;
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Protection Score</span>
            <h2>
              {dashboard.protection_score != null ? dashboard.protection_score : 'Not yet available'}
            </h2>
            <p>{dashboard.protection_score_note}</p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Status</span>
            <h2>Seven real signals, not seven green lights.</h2>
          </div>
          <div className="stat-grid stat-grid-3">
            <StatusTile
              eyebrow="Backup"
              title={dashboard.backup.configured ? 'Configured' : 'Not configured'}
              tone={dashboard.backup.configured ? 'ok' : 'muted'}
            >
              <p className="activity-meta">
                {dashboard.backup.configured
                  ? `Last: ${formatDate(dashboard.backup.last_backup_at)} (${dashboard.backup.last_backup_status}, ${dashboard.backup.last_backup_type})`
                  : 'No backup has ever run.'}
              </p>
              <p className="activity-meta">
                {dashboard.backup.recent_success_count} succeeded / {dashboard.backup.recent_failure_count} failed recently
              </p>
            </StatusTile>

            <StatusTile
              eyebrow="Recovery"
              title={dashboard.recovery.recoverable ? 'Recoverable' : 'Not recoverable'}
              tone={dashboard.recovery.recoverable ? 'ok' : 'muted'}
            >
              <p className="activity-meta">{dashboard.recovery.note}</p>
              {isAdmin && <TenantExportButton />}
            </StatusTile>

            <StatusTile
              eyebrow="Encryption"
              title={dashboard.encryption.at_rest_encrypted ? 'Encrypted at rest' : 'Not encrypted at rest'}
              tone={dashboard.encryption.at_rest_encrypted ? 'ok' : 'warn'}
            >
              <p className="activity-meta">
                Connections: {dashboard.encryption.connections_encrypted_now ? 'encrypted' : 'not encrypted'}
                {dashboard.encryption.connections_encrypted_now && !dashboard.encryption.connections_encryption_enforced
                  ? ' (opportunistic, not enforced)'
                  : ''}
              </p>
              <p className="activity-meta">{dashboard.encryption.note}</p>
            </StatusTile>

            <StatusTile
              eyebrow="Security"
              title={`${dashboard.security.recent_login_failures} failed logins (30d)`}
              tone={dashboard.security.open_remediation_items > 0 ? 'warn' : 'ok'}
            >
              <p className="activity-meta">{dashboard.security.recent_login_successes} successful logins (30d)</p>
              <p className="activity-meta">{dashboard.security.open_remediation_items} open remediation items</p>
              <p className="activity-meta">{dashboard.security.note}</p>
            </StatusTile>

            <StatusTile
              eyebrow="Compliance"
              title={dashboard.compliance.frameworks_configured.length > 0 ? 'Framework configured' : 'No framework configured'}
              tone={dashboard.compliance.frameworks_configured.length > 0 ? 'ok' : 'muted'}
            >
              <p className="activity-meta">{dashboard.compliance.note}</p>
            </StatusTile>

            <StatusTile
              eyebrow="Data Residency"
              title={dashboard.data_residency.hosting_model_known ? 'Known' : 'Unknown'}
              tone={dashboard.data_residency.hosting_model_known ? 'ok' : 'muted'}
            >
              <p className="activity-meta">{dashboard.data_residency.residency_note}</p>
            </StatusTile>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Storage Visibility</span>
            <h2>What&apos;s actually being protected, in bytes.</h2>
          </div>
          {storageResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(storageResult.error)}
            </p>
          ) : (
            <>
              <div className="stat-grid stat-grid-3">
                <StatusTile eyebrow="Conversations" title={formatBytes(storageResult.value.conversation_bytes)} />
                <StatusTile eyebrow="Knowledge" title={formatBytes(storageResult.value.knowledge_bytes)}>
                  <p className="activity-meta">{storageResult.value.knowledge_note}</p>
                </StatusTile>
                <StatusTile eyebrow="Projects" title={formatBytes(storageResult.value.project_bytes)} />
                <StatusTile eyebrow="Outputs" title={formatBytes(storageResult.value.output_bytes)}>
                  <p className="activity-meta">
                    of {formatBytes(storageResult.value.output_quota_bytes)} quota
                  </p>
                </StatusTile>
                <StatusTile eyebrow="Total Protected Data" title={formatBytes(storageResult.value.total_protected_bytes)} />
              </div>
            </>
          )}
        </div>
      </section>

      {isAdmin && (
        <section className="section alt">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Backup Management</span>
              <h2>Scheduled daily, or run one now.</h2>
            </div>
            <RunBackupButton />

            {historyResult.error ? (
              <p className="form-error" role="alert">
                {isForbidden(historyResult.error)
                  ? 'Only organisation admins can view backup history.'
                  : errorMessage(historyResult.error)}
              </p>
            ) : historyResult.value.length === 0 ? (
              <p className="activity-meta" style={{ marginTop: '1rem' }}>
                No backups have run yet.
              </p>
            ) : (
              <ul className="activity-list" style={{ marginTop: '1rem' }}>
                {historyResult.value.map((record) => (
                  <li key={record.id}>
                    <div className="assignment-row">
                      <div>
                        <p className="activity-title">
                          {formatDate(record.started_at)} <span className="badge">{record.status}</span>{' '}
                          <span className="badge">{record.backup_type}</span>
                        </p>
                        <p className="activity-meta">
                          {record.databases.join(', ')}
                          {record.total_size_bytes != null ? ` · ${formatBytes(record.total_size_bytes)}` : ''}
                          {record.error_message ? ` · ${record.error_message}` : ''}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="section">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">My Organisation Backup</span>
              <h2>Real, encrypted, tenant-bound -- yours to hold or take with you.</h2>
            </div>
            <TenantBackupPanel initialBackups={tenantBackupsResult.error ? [] : tenantBackupsResult.value} />
            {tenantBackupsResult.error && (
              <p className="form-error" role="alert" style={{ marginTop: '0.5rem' }}>
                {errorMessage(tenantBackupsResult.error)}
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
