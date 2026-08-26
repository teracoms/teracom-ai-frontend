import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchProjects } from '@/lib/api/projects';
import { fetchProjectOutputs, fetchStorageUsage } from '@/lib/api/outputArtifacts';
import { settle, errorMessage } from '@/lib/api/results';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Outputs | Teracom AI Portal',
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

// AI_ORGANISATION_EXPERIENCE_IMPLEMENTATION_V2 -- Navigation Refactor
// (focus area 6). Outputs previously only existed as a per-project
// Workspace tab (OUTPUT_REPOSITORY_IMPLEMENTATION_V1); this gives it a
// top-level, org-wide home -- every project's current-version outputs in
// one place. No new backend endpoint: fans out GET /projects/{id}/outputs
// across every real project, the same Promise.allSettled fan-out pattern
// app/portal/(protected)/workspace/[projectId]/page.js already uses for
// its own task-execution list.
export default async function OutputsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Outputs</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const [projectsSettled, storageUsageSettled] = await Promise.allSettled([
    fetchProjects(token),
    fetchStorageUsage(token),
  ]);

  const projectsResult = settle(projectsSettled);
  const storageUsageResult = settle(storageUsageSettled);

  if (projectsResult.error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Outputs</span>
            <p className="form-error" role="alert">
              {errorMessage(projectsResult.error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const projects = projectsResult.value ?? [];
  const outputsSettled = await Promise.allSettled(projects.map((project) => fetchProjectOutputs(token, project.id)));

  const rows = projects.flatMap((project, index) => {
    const outputs = settle(outputsSettled[index]).value ?? [];
    return outputs.map((output) => ({ ...output, project }));
  });
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const storageUsage = storageUsageResult.value ?? null;
  const usedPercent = storageUsage ? storageUsage.used_percent : null;
  const usageTone = usedPercent >= 90 ? 'var(--danger, #ff1717)' : usedPercent >= 75 ? 'var(--warn, #e0a536)' : undefined;

  return (
    <main>
      <section className="hero hero-product hero-compact">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">
              <Link href="/portal/dashboard">&larr; Dashboard</Link>
            </span>
            <h1>Outputs</h1>
            <p className="lead">Every deliverable Teracom AI has produced, across all your projects.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {storageUsage && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <p className="eyebrow">Storage usage</p>
              <p style={{ fontSize: 14, margin: '4px 0' }}>
                {formatBytes(storageUsage.used_bytes)} of {formatBytes(storageUsage.quota_bytes)} used
                {usageTone && <span style={{ color: usageTone, marginLeft: 8 }}>({usedPercent}%)</span>}
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

          {rows.length === 0 ? (
            <EmptyState
              title="No outputs yet"
              description="Deliverables uploaded to any project's Outputs tab will show up here."
            />
          ) : (
            <ul className="activity-list">
              {rows.map((output) => (
                <li key={output.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">
                        {output.filename} <span className="badge badge-muted">{output.artifact_type}</span>{' '}
                        <span className="badge badge-muted">v{output.version}</span>
                      </p>
                      <p className="activity-meta">
                        <Link href={`/portal/workspace/${output.project.id}`}>{output.project.name}</Link>{' '}
                        · {formatBytes(output.size_bytes)} · {formatDate(output.created_at)}
                      </p>
                    </div>
                    <a className="btn btn-primary btn-small" href={`/api/portal/projects/${output.project.id}/outputs/${output.id}/download`}>
                      Download
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
