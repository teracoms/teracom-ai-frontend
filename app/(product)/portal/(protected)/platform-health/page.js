import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchPlatformHealthSummary } from '@/lib/api/platformHealth';
import { fetchDeploymentRecords } from '@/lib/api/deploymentRecords';
import { fetchPlatformIncidents } from '@/lib/api/platformIncidents';
import { fetchSystemMetricsSummary } from '@/lib/api/systemMetrics';
import { settle, errorMessage } from '@/lib/api/results';
import PlatformHealthSummaryWidget from '@/components/portal/PlatformHealthSummaryWidget';
import DeploymentRecordPanel from '@/components/portal/DeploymentRecordPanel';
import PlatformIncidentPanel from '@/components/portal/PlatformIncidentPanel';
import SystemMetricsPanel from '@/components/portal/SystemMetricsPanel';
import PlatformSectionNav from '@/components/portal/PlatformSectionNav';

export const metadata = {
  title: 'Platform Health | Teracom AI Portal',
};

/**
 * The Production Operations workspace (Phase 0 Package PQR,
 * objectives #10-#14) — organisation-scoped (each organisation's own
 * environment), reusing the existing Organisation/User model exactly
 * like every prior package. No code path here touches real
 * infrastructure.
 */
export default async function PlatformHealthPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Platform Health</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the Platform Health workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');

  // Per-section resilience (ADR-008): the summary, deployment list,
  // incident list, and (admin-only) system metrics are independent of
  // each other. System metrics is only fetched for an admin at all —
  // the backend already 403s a non-admin, but this avoids making a
  // real fetch a non-admin's rendered page never shows anyway (the
  // same Server-Component-still-fetches gap Package 9/Package H's own
  // admin pages already had to account for).
  const [summarySettled, deploymentsSettled, incidentsSettled, systemMetricsSettled] = await Promise.allSettled([
    fetchPlatformHealthSummary(token),
    fetchDeploymentRecords(token),
    fetchPlatformIncidents(token),
    isAdmin ? fetchSystemMetricsSummary(token) : Promise.resolve(null),
  ]);

  const summaryResult = settle(summarySettled);
  const deploymentsResult = settle(deploymentsSettled);
  const incidentsResult = settle(incidentsSettled);
  const systemMetricsResult = settle(systemMetricsSettled);

  return (
    <>
      <PlatformSectionNav />
      <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Platform Health</span>
            <h1>Production operations.</h1>
            <p className="lead">
              Deployment governance and platform incident tracking for your own environment — no
              action here ever triggers a real deployment or infrastructure change.
            </p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="section">
          <div className="container">
            {systemMetricsResult.error ? (
              <p className="form-error" role="alert">
                {errorMessage(systemMetricsResult.error)}
              </p>
            ) : systemMetricsResult.value ? (
              <SystemMetricsPanel metrics={systemMetricsResult.value} />
            ) : null}
          </div>
        </section>
      )}

      <section className="section alt">
        <div className="container">
          {summaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summaryResult.error)}
            </p>
          ) : (
            <PlatformHealthSummaryWidget summary={summaryResult.value} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {deploymentsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(deploymentsResult.error)}
            </p>
          ) : (
            <DeploymentRecordPanel records={deploymentsResult.value ?? []} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {incidentsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(incidentsResult.error)}
            </p>
          ) : (
            <PlatformIncidentPanel incidents={incidentsResult.value ?? []} />
          )}
        </div>
      </section>
    </main>
    </>
  );
}
