import { getSessionToken } from '@/lib/api/auth';
import { fetchUserSettings } from '@/lib/api/userSettings';
import { fetchLoginHistory } from '@/lib/api/securityEvents';
import { settle, errorMessage } from '@/lib/api/results';
import ChangePasswordForm from '@/components/portal/ChangePasswordForm';
import MfaEnrollment from '@/components/portal/MfaEnrollment';
import ActiveSessionsPanel from '@/components/portal/ActiveSessionsPanel';

export const metadata = {
  title: 'Security | Teracom AI Portal',
};

/**
 * Settings & Security V1 -- Security: MFA, Password Management, Active
 * Sessions, Login History (SETTINGS_SECURITY_V1_ARCHITECTURE.md §5).
 * Session Timeout is deliberately NOT here -- it's an organisation-wide
 * policy set once at /portal/admin/security, not a per-user control.
 */
export default async function SecurityPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Security</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view your security settings.</p>
          </div>
        </section>
      </main>
    );
  }

  const [settingsResult, loginHistoryResult] = await Promise.allSettled([
    fetchUserSettings(token),
    fetchLoginHistory(token),
  ]);
  const settings = settle(settingsResult);
  const loginHistory = settle(loginHistoryResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Security</span>
            <h1>Your account security.</h1>
            <p className="lead">Multi-factor authentication, password, active sessions, and login history.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left" style={{ marginTop: 0 }}>
            <h2>Multi-factor authentication</h2>
          </div>
          {settings.error ? (
            <p className="form-error" role="alert">
              {errorMessage(settings.error)}
            </p>
          ) : (
            <MfaEnrollment initiallyEnabled={settings.value.mfa_enabled} />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <h2>Password</h2>
          </div>
          <ChangePasswordForm />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <h2>Active sessions</h2>
          </div>
          <ActiveSessionsPanel />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <h2>Login history</h2>
          </div>
          {loginHistory.error ? (
            <p className="form-error" role="alert">
              {errorMessage(loginHistory.error)}
            </p>
          ) : loginHistory.value.length === 0 ? (
            <p className="activity-meta">No login activity recorded yet.</p>
          ) : (
            <ul className="activity-list">
              {loginHistory.value.map((event) => (
                <li key={event.id}>
                  <div className="assignment-row">
                    <div>
                      <p className="activity-title">
                        {event.event_type === 'login_success' ? 'Signed in' : 'Failed sign-in attempt'}
                      </p>
                      <p className="activity-meta">
                        {new Date(event.occurred_at).toLocaleString()}
                        {event.ip_address ? ` · ${event.ip_address}` : ''}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
