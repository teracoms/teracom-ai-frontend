import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchMyOrganisationIdentity, fetchOrganisationSummary } from '@/lib/api/dashboard';
import { fetchOnboardingWizardProgress } from '@/lib/api/onboardingWizard';
import { fetchDepartments } from '@/lib/api/departments';
import { fetchExecutiveRoles } from '@/lib/api/executiveRoles';
import { fetchWorkerList, fetchKnowledgeCatalogue } from '@/lib/api/workers';
import { fetchOrganisationGovernanceRules, fetchGovernancePolicies } from '@/lib/api/governancePolicies';
import { fetchFederationProviders } from '@/lib/api/federation';
import { settle, errorMessage } from '@/lib/api/results';
import { ONBOARDING_WIZARD_STEPS } from '@/lib/onboardingWizardSteps';
import OnboardingWizardStep1 from '@/components/portal/OnboardingWizardStep1';
import OnboardingWizardStep2 from '@/components/portal/OnboardingWizardStep2';
import OnboardingWizardStep3 from '@/components/portal/OnboardingWizardStep3';
import OnboardingWizardStep4 from '@/components/portal/OnboardingWizardStep4';
import OnboardingWizardStep5 from '@/components/portal/OnboardingWizardStep5';
import OnboardingWizardStep6 from '@/components/portal/OnboardingWizardStep6';
import OnboardingWizardStep7 from '@/components/portal/OnboardingWizardStep7';
import OnboardingWizardStep8 from '@/components/portal/OnboardingWizardStep8';
import OnboardingWizardStep9 from '@/components/portal/OnboardingWizardStep9';

export const metadata = {
  title: 'Organisation Workflow Wizard | Teracom AI Portal',
};

/**
 * CUSTOMER_ONBOARDING_WIZARD_V1.md -- Wizard Framework V1 entry point.
 * Renders the full 9-step shape (ONBOARDING_WIZARD_STEPS) -- all nine
 * are real as of Wizard Framework V1-V5 (see onboardingWizardSteps.js),
 * not "coming soon" placeholders. UI Review Sprint V1 -- reframed from a
 * one-time onboarding flow to a permanently-available Organisation
 * Workflow Wizard: every step remains revisitable after completion to
 * add departments, executive roles, workers, knowledge, governance
 * rules, or integrations, not just to complete first-time setup.
 */
export default async function OnboardingWizardPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Organisation Workflow Wizard</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to continue.</p>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');

  const [
    identityResult,
    progressResult,
    summaryResult,
    departmentsResult,
    executiveRolesResult,
    workersResult,
    knowledgeResult,
    organisationRulesResult,
    governancePoliciesResult,
    federationProvidersResult,
  ] = await Promise.allSettled([
    fetchMyOrganisationIdentity(token),
    fetchOnboardingWizardProgress(token),
    isAdmin ? fetchOrganisationSummary(token) : Promise.resolve(null),
    isAdmin ? fetchDepartments(token) : Promise.resolve(null),
    isAdmin ? fetchExecutiveRoles(token) : Promise.resolve(null),
    isAdmin ? fetchWorkerList(token) : Promise.resolve(null),
    isAdmin ? fetchKnowledgeCatalogue(token) : Promise.resolve(null),
    isAdmin ? fetchOrganisationGovernanceRules(token) : Promise.resolve(null),
    isAdmin ? fetchGovernancePolicies(token) : Promise.resolve(null),
    isAdmin ? fetchFederationProviders(token) : Promise.resolve(null),
  ]);

  const identity = settle(identityResult);
  const progress = settle(progressResult);
  const summary = settle(summaryResult);
  const departments = settle(departmentsResult);
  const executiveRoles = settle(executiveRolesResult);
  const workers = settle(workersResult);
  const knowledge = settle(knowledgeResult);
  const organisationRules = settle(organisationRulesResult);
  const governancePolicies = settle(governancePoliciesResult);
  const federationProviders = settle(federationProvidersResult);
  const completedSteps = progress.value?.completed_steps ?? [];
  const step1Done = completedSteps.includes(1);
  const step2Done = completedSteps.includes(2);
  const step3Done = completedSteps.includes(3);
  const step4Done = completedSteps.includes(4);
  const step5Done = completedSteps.includes(5);
  const step6Done = completedSteps.includes(6);
  const step7Done = completedSteps.includes(7);
  const step8Done = completedSteps.includes(8);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Organisation Workflow Wizard</span>
            <h1>Manage {identity.value?.name ?? 'your organisation'}&apos;s setup.</h1>
            <p className="lead">
              Nine guided steps for building and maintaining your organisation — departments,
              executive roles, workers, knowledge, governance, and integrations. Available any time,
              not just for first-time setup — revisit a step whenever you need to add or change
              something.
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
              hasFavicon={Boolean(summary.value?.favicon_ref)}
              initialPrimaryColor={summary.value?.primary_brand_color ?? null}
              initialSecondaryColor={summary.value?.secondary_brand_color ?? null}
              stepAlreadyCompleted={step1Done}
            />
          )}
        </div>
      </section>

      {isAdmin && !identity.error && (
        <section className="section">
          <div className="container">
            {!step1Done ? (
              <p className="activity-meta">
                Complete organisation setup above first, then come back here to build your
                organisation structure.
              </p>
            ) : departments.error ? (
              <p className="form-error" role="alert">
                {errorMessage(departments.error)}
              </p>
            ) : (
              <OnboardingWizardStep2
                organisationName={identity.value.name}
                initialDepartments={departments.value ?? []}
                stepAlreadyCompleted={step2Done}
              />
            )}
          </div>
        </section>
      )}

      {isAdmin && !identity.error && (
        <section className="section alt">
          <div className="container">
            {!step2Done ? (
              <p className="activity-meta">
                Complete organisation structure above first, then come back here to set up your
                executive team.
              </p>
            ) : executiveRoles.error || workers.error ? (
              <p className="form-error" role="alert">
                {errorMessage(executiveRoles.error || workers.error)}
              </p>
            ) : (
              <OnboardingWizardStep3
                organisationName={identity.value.name}
                initialExecutiveRoles={executiveRoles.value ?? []}
                departments={departments.value ?? []}
                workers={workers.value ?? []}
                stepAlreadyCompleted={step3Done}
              />
            )}
          </div>
        </section>
      )}

      {isAdmin && !identity.error && (
        <section className="section">
          <div className="container">
            {!step3Done ? (
              <p className="activity-meta">
                Complete executive structure above first, then come back here to build your
                digital workforce.
              </p>
            ) : departments.error || executiveRoles.error || workers.error ? (
              <p className="form-error" role="alert">
                {errorMessage(departments.error || executiveRoles.error || workers.error)}
              </p>
            ) : (
              <OnboardingWizardStep4
                organisationName={identity.value.name}
                initialWorkers={workers.value ?? []}
                departments={departments.value ?? []}
                executiveRoles={executiveRoles.value ?? []}
                stepAlreadyCompleted={step4Done}
              />
            )}
          </div>
        </section>
      )}

      {isAdmin && !identity.error && (
        <section className="section alt">
          <div className="container">
            {!step4Done ? (
              <p className="activity-meta">
                Complete digital workforce above first, then come back here to set up your
                knowledge.
              </p>
            ) : knowledge.error ? (
              <p className="form-error" role="alert">
                {errorMessage(knowledge.error)}
              </p>
            ) : (
              <OnboardingWizardStep5
                initialKnowledge={knowledge.value ?? []}
                stepAlreadyCompleted={step5Done}
              />
            )}
          </div>
        </section>
      )}

      {isAdmin && !identity.error && (
        <section className="section">
          <div className="container">
            {!step5Done ? (
              <p className="activity-meta">
                Complete knowledge setup above first, then come back here to set up governance.
              </p>
            ) : organisationRules.error || governancePolicies.error || departments.error ? (
              <p className="form-error" role="alert">
                {errorMessage(organisationRules.error || governancePolicies.error || departments.error)}
              </p>
            ) : (
              <OnboardingWizardStep6
                organisationRules={organisationRules.value ?? []}
                departments={departments.value ?? []}
                governancePolicies={governancePolicies.value?.policies ?? []}
                stepAlreadyCompleted={step6Done}
              />
            )}
          </div>
        </section>
      )}

      {isAdmin && !identity.error && (
        <section className="section alt">
          <div className="container">
            {!step6Done ? (
              <p className="activity-meta">
                Complete governance setup above first, then come back here to review integrations.
              </p>
            ) : federationProviders.error ? (
              <p className="form-error" role="alert">
                {errorMessage(federationProviders.error)}
              </p>
            ) : (
              <OnboardingWizardStep7
                organisation={summary.value}
                federationProviders={federationProviders.value ?? []}
                stepAlreadyCompleted={step7Done}
              />
            )}
          </div>
        </section>
      )}

      {isAdmin && !identity.error && (
        <section className="section">
          <div className="container">
            {!step7Done ? (
              <p className="activity-meta">
                Complete integrations above first, then come back here to review your
                organisation.
              </p>
            ) : (
              <OnboardingWizardStep8
                organisationName={identity.value.name}
                departments={departments.value ?? []}
                executiveRoles={executiveRoles.value ?? []}
                workers={workers.value ?? []}
                knowledgeCount={(knowledge.value ?? []).length}
                governanceRuleCount={(organisationRules.value ?? []).length}
              />
            )}
          </div>
        </section>
      )}

      {isAdmin && !identity.error && (
        <section className="section alt">
          <div className="container">
            {!step8Done ? (
              <p className="activity-meta">
                Review your organisation above first, then come back here to launch.
              </p>
            ) : (
              <OnboardingWizardStep9
                organisationName={identity.value.name}
                organisationId={identity.value.id}
                trialEndsAt={summary.value?.trial_ends_at ?? null}
                completedSteps={completedSteps}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}
