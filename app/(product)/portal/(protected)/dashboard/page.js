import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import {
  fetchPortalDashboard,
  fetchRecentActivity,
  fetchChatAnalytics,
  fetchOrganisationSummary,
  fetchMyOrganisationIdentity,
} from '@/lib/api/dashboard';
import { fetchOnboardingWizardProgress } from '@/lib/api/onboardingWizard';
import { settle, errorMessage, isForbidden } from '@/lib/api/results';
import StatTile from '@/components/portal/StatTile';
import ActivitySection from '@/components/portal/ActivitySection';
import OrganisationSummaryCard from '@/components/portal/OrganisationSummaryCard';
import DashboardQuickLinks from '@/components/portal/DashboardQuickLinks';
import OnboardingWizardStatusBanner from '@/components/portal/OnboardingWizardStatusBanner';
import { WorkersIcon, KnowledgeIcon, MemoryIcon, ChatIcon } from '@/components/portal/icons';

export const metadata = {
  title: 'Dashboard | Teracom AI Portal',
};

export default async function DashboardPage() {
  const token = getSessionToken();

  // Defensive only: app/portal/(protected)/layout.js already guarantees a
  // valid session before this page renders. A null token here would mean
  // the cookie was cleared in the moment between layout and page render.
  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Dashboard</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the dashboard.</p>
          </div>
        </section>
      </main>
    );
  }

  // Each section's data comes from an independent backend call — Promise.allSettled
  // so that one endpoint failing (e.g. the admin-only /organisations/ call for a
  // non-admin user) doesn't take down the sections that succeeded.
  const [dashboardResult, activityResult, chatAnalyticsResult, organisationResult, identityResult, wizardProgressResult] =
    await Promise.allSettled([
      fetchPortalDashboard(token),
      fetchRecentActivity(token),
      fetchChatAnalytics(token),
      fetchOrganisationSummary(token),
      fetchMyOrganisationIdentity(token),
      fetchOnboardingWizardProgress(token),
    ]);

  const dashboard = settle(dashboardResult);
  const activity = settle(activityResult);
  const chatAnalytics = settle(chatAnalyticsResult);
  const organisation = settle(organisationResult);
  const identity = settle(identityResult);
  const wizardProgress = settle(wizardProgressResult);

  const organisationRestricted = isForbidden(organisation.error);
  const canCreateWorker = isAtLeastRole(decodeJwtPayload(token)?.role, 'admin');
  const isBrandNewOrganisation = !dashboard.error && dashboard.value.workers === 0;
  const organisationName = identity.error ? null : identity.value?.name;

  return (
    <main>
      <section className="hero hero-product hero-dashboard">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">{organisationName ?? 'Dashboard'}</span>
            <h1>{organisationName ? `${organisationName} — Organisation overview.` : 'Organisation overview.'}</h1>
            <p className="lead">
              Workers, knowledge, memory and chat activity for your organisation, in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-compact">
        <div className="container">
          <OnboardingWizardStatusBanner progress={wizardProgress.error ? null : wizardProgress.value} />
          {isBrandNewOrganisation && (
            <p className="form-note-banner" role="status">
              <strong>Get your organisation started.</strong>{' '}
              {canCreateWorker ? (
                <>
                  You don&apos;t have any AI workers yet —{' '}
                  <Link href="/portal/workers/new">create your first worker</Link> to begin, or browse{' '}
                  <Link href="/portal/marketplace">the Marketplace</Link> for a ready-made pack. See{' '}
                  <Link href="/portal/training">Training</Link> for a full setup walkthrough.
                </>
              ) : (
                <>
                  Your organisation doesn&apos;t have any AI workers yet — ask an organisation admin to
                  create the first one, or see <Link href="/portal/training">Training</Link> for what
                  happens next.
                </>
              )}
            </p>
          )}
          {dashboard.error ? (
            <p className="form-error" role="alert">
              {errorMessage(dashboard.error)}
            </p>
          ) : (
            <div className="stat-grid">
              <StatTile
                label="Workers"
                value={dashboard.value.workers}
                hint="Active AI workers in your organisation"
                icon={<WorkersIcon />}
                href="/portal/workers"
              />
              <StatTile
                label="Knowledge"
                value={dashboard.value.knowledge}
                hint="Documents in your knowledge base"
                icon={<KnowledgeIcon />}
                href="/portal/knowledge"
              />
              <StatTile
                label="Memories"
                value={dashboard.value.memories}
                hint="Memories captured across all workers"
                icon={<MemoryIcon />}
                href="/portal/memory"
              />
              <StatTile
                label="Chat Sessions"
                value={dashboard.value.chat_sessions}
                hint="Conversations across all workers"
                icon={<ChatIcon />}
                href="/portal/chat"
              />
            </div>
          )}
        </div>
      </section>

      <section className="section section-compact">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Explore your workspace</span>
            <h2>Everything available to your organisation.</h2>
          </div>
          <DashboardQuickLinks />
        </div>
      </section>

      <section className="section section-compact alt">
        <div className="container dashboard-columns">
          <div>
            <span className="eyebrow">Organisation summary</span>
            {organisation.error && !organisationRestricted ? (
              <p className="form-error" role="alert">
                {errorMessage(organisation.error)}
              </p>
            ) : (
              <OrganisationSummaryCard
                organisation={organisation.value}
                restricted={organisationRestricted}
              />
            )}
          </div>

          <div>
            <span className="eyebrow">Platform statistics</span>
            {chatAnalytics.error ? (
              <p className="form-error" role="alert">
                {errorMessage(chatAnalytics.error)}
              </p>
            ) : (
              <div className="stat-grid stat-grid-2">
                <StatTile
                  label="Chat Sessions"
                  value={chatAnalytics.value.sessions}
                  hint="All conversations, organisation-wide"
                  icon={<ChatIcon />}
                  href="/portal/chat"
                />
                <StatTile
                  label="Chat Messages"
                  value={chatAnalytics.value.messages}
                  hint="All messages sent within those sessions"
                  icon={<ChatIcon />}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section section-compact">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Recent activity</span>
            <h2>What&apos;s happened lately.</h2>
          </div>

          {activity.error ? (
            <p className="form-error" role="alert">
              {errorMessage(activity.error)}
            </p>
          ) : (
            <div className="activity-columns">
              <ActivitySection
                title="Knowledge"
                items={activity.value.knowledge}
                emptyDescription="No knowledge documents have been uploaded yet."
                renderItem={(item) => (
                  <>
                    <p className="activity-title">{item.title}</p>
                    <p className="activity-meta">Source: {item.source}</p>
                  </>
                )}
              />

              <ActivitySection
                title="Chat sessions"
                items={activity.value.chat_sessions}
                emptyDescription="No conversations have been started yet."
                renderItem={(item) => <p className="activity-title">{item.title}</p>}
              />

              <ActivitySection
                title="Memories"
                items={activity.value.memories}
                emptyDescription="No memories have been captured yet."
                renderItem={(item) => (
                  <>
                    <p className="activity-title">{item.memory_content}</p>
                    <p className="activity-meta">Type: {item.memory_type}</p>
                  </>
                )}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
