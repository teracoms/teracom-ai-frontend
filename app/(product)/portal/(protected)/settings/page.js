import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchUserSettings } from '@/lib/api/userSettings';
import { errorMessage } from '@/lib/api/results';
import UserSettingsForm from '@/components/portal/UserSettingsForm';

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
  try {
    settings = await fetchUserSettings(token);
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
          <UserSettingsForm initialSettings={settings} />
        </div>
      </section>
    </main>
  );
}
