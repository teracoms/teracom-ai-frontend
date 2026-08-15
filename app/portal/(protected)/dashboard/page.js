import { getSessionToken } from '@/lib/api/auth';
import {
  fetchPortalDashboard,
  fetchRecentActivity,
  fetchChatAnalytics,
  fetchOrganisationSummary,
} from '@/lib/api/dashboard';
import { settle, errorMessage, isForbidden } from '@/lib/api/results';
import StatTile from '@/components/portal/StatTile';
import ActivitySection from '@/components/portal/ActivitySection';
import OrganisationSummaryCard from '@/components/portal/OrganisationSummaryCard';

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
  const [dashboardResult, activityResult, chatAnalyticsResult, organisationResult] =
    await Promise.allSettled([
      fetchPortalDashboard(token),
      fetchRecentActivity(token),
      fetchChatAnalytics(token),
      fetchOrganisationSummary(token),
    ]);

  const dashboard = settle(dashboardResult);
  const activity = settle(activityResult);
  const chatAnalytics = settle(chatAnalyticsResult);
  const organisation = settle(organisationResult);

  const organisationRestricted = isForbidden(organisation.error);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Dashboard</span>
            <h1>Organisation overview.</h1>
            <p className="lead">
              Workers, knowledge, memory and chat activity for your organisation, sourced from
              teracom-ai-backend&apos;s portal dashboard endpoint.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {dashboard.error ? (
            <p className="form-error" role="alert">
              {errorMessage(dashboard.error)}
            </p>
          ) : (
            <div className="stat-grid">
              <StatTile label="Workers" value={dashboard.value.workers} />
              <StatTile label="Knowledge" value={dashboard.value.knowledge} />
              <StatTile label="Memories" value={dashboard.value.memories} />
              <StatTile label="Chat Sessions" value={dashboard.value.chat_sessions} />
            </div>
          )}
        </div>
      </section>

      <section className="section alt">
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
                <StatTile label="Chat Sessions" value={chatAnalytics.value.sessions} />
                <StatTile label="Chat Messages" value={chatAnalytics.value.messages} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
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
