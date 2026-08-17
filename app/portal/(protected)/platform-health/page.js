import { getSessionToken } from '@/lib/api/auth';
import { fetchPlatformHealthSummary } from '@/lib/api/platformHealth';
import { fetchDeploymentRecords } from '@/lib/api/deploymentRecords';
import { fetchPlatformIncidents } from '@/lib/api/platformIncidents';
import { settle, errorMessage } from '@/lib/api/results';
import PlatformHealthSummaryWidget from '@/components/portal/PlatformHealthSummaryWidget';
import DeploymentRecordPanel from '@/components/portal/DeploymentRecordPanel';
import PlatformIncidentPanel from '@/components/portal/PlatformIncidentPanel';

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

  // Per-section resilience (ADR-008): the summary, deployment list,
  // and incident list are independent of each other.
  const [summarySettled, deploymentsSettled, incidentsSettled] = await Promise.allSettled([
    fetchPlatformHealthSummary(token),
    fetchDeploymentRecords(token),
    fetchPlatformIncidents(token),
  ]);

  const summaryResult = settle(summarySettled);
  const deploymentsResult = settle(deploymentsSettled);
  const incidentsResult = settle(incidentsSettled);

  return (
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

      <section className="section">
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

      <section className="section alt">
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

      <section className="section">
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
  );
}
