import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchUserSettings } from '@/lib/api/userSettings';
import { fetchMyOrganisationMemberships } from '@/lib/api/organisationMemberships';
import { errorMessage } from '@/lib/api/results';
import UserSettingsForm from '@/components/portal/UserSettingsForm';
import OrganisationMembershipsPanel from '@/components/portal/OrganisationMembershipsPanel';

export const metadata = {
  title: 'Settings | Teracom AI Portal',
};

/**
 * Settings & Security V1 -- User Settings (Profile, Theme, Notifications,
 * Timezone, Accessibility, Dashboard Preferences), all in one form
 * (SETTINGS_SECURITY_V1_ARCHITECTURE.md §5). No hero background image
 * exists for Settings -- none of Image Pack V1's ten categories map to
 * it, and none was requested here, so this page keeps the plain,
 * unmodified .hero:before gradient like every other un-imaged page.
 */
export default async function SettingsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Settings</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your settings.</p>
          </div>
        </section>
      </main>
    );
  }

  let settings;
  let memberships = [];
  try {
    settings = await fetchUserSettings(token);
    // ORG002 -- best-effort: a failure here shouldn't block the rest
    // of Settings, same per-section resilience already used
    // elsewhere in this app (e.g. admin/organisation/page.js).
    try {
      memberships = await fetchMyOrganisationMemberships(token);
    } catch {
      memberships = [];
    }
  } catch (error) {
    return (
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Settings</span>
              <h1>Your settings.</h1>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container">
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
            <span className="eyebrow">Settings</span>
            <h1>Your settings.</h1>
            <p className="lead">Profile, theme, notifications, timezone, accessibility, and dashboard.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="activity-meta" style={{ marginBottom: '20px' }}>
            Looking for MFA, password, active sessions, or login history?{' '}
            <Link href="/portal/settings/security">Go to Security.</Link>
          </p>
          <p className="activity-meta" style={{ marginBottom: '20px' }}>
            Looking for voice provider, speech speed, or continuous/push-to-talk mode?{' '}
            <Link href="/portal/settings/voice">Go to Voice Settings.</Link>
          </p>
          <UserSettingsForm initialSettings={settings} />
        </div>
      </section>

      {memberships.length > 0 && (
        <section className="section alt">
          <div className="container">
            <div className="section-heading left">
              <span className="eyebrow">Organisations</span>
              <h2>Your organisations.</h2>
              <p>Every organisation you belong to, and which one is currently active.</p>
            </div>
            <OrganisationMembershipsPanel memberships={memberships} />
          </div>
        </section>
      )}
    </main>
  );
}
