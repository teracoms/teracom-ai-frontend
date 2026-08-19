import { getSessionToken } from '@/lib/api/auth';
import { fetchOrganisationOnboardingTasks } from '@/lib/api/organisationOnboarding';
import { errorMessage } from '@/lib/api/results';
import OrganisationOnboardingChecklist from '@/components/portal/OrganisationOnboardingChecklist';

export const metadata = {
  title: 'Onboarding | Teracom AI Portal',
};

/**
 * Phase 0 Package Q — Commercial Provisioning & Entitlements. Shows the
 * organisation-level checklist auto-seeded by the backend the moment a
 * completed sale (an approved initial_issuance licence request) activates
 * the organisation, plus one follow-up item per worker-pack provisioning
 * action since. An empty list is a real, expected state for an
 * organisation that hasn't had its first licence approved yet — not an
 * error.
 */
export default async function OnboardingPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Your Organisation&apos;s Onboarding</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your onboarding checklist.</p>
          </div>
        </section>
      </main>
    );
  }

  let tasks;
  try {
    tasks = await fetchOrganisationOnboardingTasks(token);
  } catch (error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Your Organisation&apos;s Onboarding</span>
            <p className="form-error" role="alert">
              {errorMessage(error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Your Organisation&apos;s Onboarding</span>
            <h1>Get your organisation set up.</h1>
            <p className="lead">
              A checklist for getting the most out of your licence, seeded automatically once your
              first purchase is approved.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <OrganisationOnboardingChecklist tasks={tasks ?? []} />
        </div>
      </section>
    </main>
  );
}
