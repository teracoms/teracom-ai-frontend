import { getSessionToken } from '@/lib/api/auth';
import { fetchFederationProviders, fetchFederationSummary } from '@/lib/api/federation';
import { fetchFederationConsultations } from '@/lib/api/federationConsultation';
import { fetchWorkerList } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import FederationProviderList from '@/components/portal/FederationProviderList';
import FederationConsultationPanel from '@/components/portal/FederationConsultationPanel';
import FederationConsultationHistory from '@/components/portal/FederationConsultationHistory';
import FederationSummaryWidget from '@/components/portal/FederationSummaryWidget';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Federation | Teracom AI Portal',
};

/**
 * The Federation workspace (Phase 0 Package L): the registry
 * (objective #1), the worker-to-federation consultation flow
 * (objectives #4/#5), consultation history, and executive visibility
 * of federation activity (objectives #10/#11).
 */
export default async function FederationPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Federation</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to use Federation consultation.</p>
          </div>
        </section>
      </main>
    );
  }

  // Per-section resilience (ADR-008): the registry, worker list,
  // consultation history, and summary are independent of each other.
  const [providersSettled, workersSettled, consultationsSettled, summarySettled] = await Promise.allSettled([
    fetchFederationProviders(token),
    fetchWorkerList(token),
    fetchFederationConsultations(token),
    fetchFederationSummary(token),
  ]);

  const providersResult = settle(providersSettled);
  const workersResult = settle(workersSettled);
  const activeWorkers = (workersResult.value ?? []).filter((worker) => worker.status === 'active');
  const consultationsResult = settle(consultationsSettled);
  const summaryResult = settle(summarySettled);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Federation</span>
            <h1>External AI consulting.</h1>
            <p className="lead">
              Browse the registry of external AI providers, check a worker&apos;s confidence
              before escalating, and consult federation when local confidence is insufficient or
              specialist expertise is required.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Registry</span>
            <h2>Federation providers.</h2>
          </div>
          {providersResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(providersResult.error)}
            </p>
          ) : (
            <FederationProviderList providers={providersResult.value ?? []} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {workersResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(workersResult.error)}
            </p>
          ) : activeWorkers.length === 0 ? (
            <EmptyState
              title="No active workers yet"
              description="Create at least one active worker before consulting federation."
            />
          ) : (
            <FederationConsultationPanel workers={activeWorkers} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">History</span>
            <h2>Consultation history.</h2>
          </div>
          {consultationsResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(consultationsResult.error)}
            </p>
          ) : (
            <FederationConsultationHistory consultations={consultationsResult.value ?? []} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {summaryResult.error ? (
            <p className="form-error" role="alert">
              {errorMessage(summaryResult.error)}
            </p>
          ) : (
            <FederationSummaryWidget summary={summaryResult.value} />
          )}
        </div>
      </section>
    </main>
  );
}
