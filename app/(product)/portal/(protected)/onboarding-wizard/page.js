import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchMyOrganisationIdentity, fetchOrganisationSummary } from '@/lib/api/dashboard';
import { fetchOnboardingWizardProgress } from '@/lib/api/onboardingWizard';
import { settle, errorMessage } from '@/lib/api/results';
import { ONBOARDING_WIZARD_STEPS } from '@/lib/onboardingWizardSteps';
import OnboardingWizardStep1 from '@/components/portal/OnboardingWizardStep1';

export const metadata = {
  title: 'Organisation Setup | Teracom AI Portal',
};

/**
 * CUSTOMER_ONBOARDING_WIZARD_V1.md -- Wizard Framework V1 entry point.
 * Renders the full 9-step shape (ONBOARDING_WIZARD_STEPS) so the
 * framework is testable end-to-end, but only step 1's content is real
 * -- steps 2-9 are shown as "coming soon", not built, per instruction
 * (Executive hierarchy automation, Platform administration, Tenant
 * redesign, and Marketplace automation all remain design-only).
 */
export default async function OnboardingWizardPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Organisation Setup</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to continue setup.</p>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');

  const [identityResult, progressResult, summaryResult] = await Promise.allSettled([
    fetchMyOrganisationIdentity(token),
    fetchOnboardingWizardProgress(token),
    isAdmin ? fetchOrganisationSummary(token) : Promise.resolve(null),
  ]);

  const identity = settle(identityResult);
  const progress = settle(progressResult);
  const summary = settle(summaryResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Organisation Setup</span>
            <h1>Set up {identity.value?.name ?? 'your organisation'}.</h1>
            <p className="lead">
              A short, guided setup — no documentation required. This is the foundation of a longer
              wizard; more steps are on the way.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {progress.error ? (
            <p className="form-error" role="alert">
              {errorMessage(progress.error)}
            </p>
          ) : (
            <ol className="wizard-steps">
              {ONBOARDING_WIZARD_STEPS.map((item) => {
                const isCompleted = (progress.value?.completed_steps ?? []).includes(item.step);
                const isCurrent = item.available && !isCompleted;
                return (
                  <li key={item.step} className={isCompleted ? 'done' : isCurrent ? 'active' : ''}>
                    {item.step}. {item.label}
                    {!item.available && ' (coming soon)'}
                    {isCompleted && ' — done'}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {!isAdmin ? (
            <p className="activity-meta">
              Only organisation admins can run organisation setup. Ask an admin to complete this, or
              view your organisation&apos;s current details on the Dashboard.
            </p>
          ) : identity.error ? (
            <p className="form-error" role="alert">
              {errorMessage(identity.error)}
            </p>
          ) : (
            <OnboardingWizardStep1
              organisationName={identity.value.name}
              initialIndustry={summary.value?.industry ?? null}
              initialCountry={summary.value?.country ?? null}
              initialBusinessSize={summary.value?.business_size ?? null}
              hasLogo={Boolean(identity.value.logo_ref)}
              stepAlreadyCompleted={(progress.value?.completed_steps ?? []).includes(1)}
            />
          )}
        </div>
      </section>
    </main>
  );
}
