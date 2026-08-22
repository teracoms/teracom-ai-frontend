import { redirect } from 'next/navigation';

import { getSessionUser, getSessionToken } from '@/lib/api/auth';
import { fetchMyOrganisationIdentity } from '@/lib/api/dashboard';
import { fetchUserSettings } from '@/lib/api/userSettings';
import { AuthProvider } from '@/components/portal/AuthProvider';
import PortalNav from '@/components/portal/PortalNav';
import AccessibilityPreferences from '@/components/portal/AccessibilityPreferences';

// Authoritative session guard for every /portal route except /portal/login.
// middleware.js already redirects requests with no session cookie before
// they get here; this layout re-validates the token against the backend
// (GET /auth/me) on every request, which also transparently covers expired
// or revoked-by-deletion sessions that a cookie-presence check alone can't
// catch — see FRONTEND_ARCHITECTURE_V1.md §C.5.
export default async function ProtectedPortalLayout({ children }) {
  let user = null;

  try {
    user = await getSessionUser();
  } catch {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Portal unavailable</span>
            <h1>We can&apos;t reach the Teracom AI backend right now.</h1>
            <p className="lead">
              Your session could not be verified because the backend service did not respond.
              Please try again shortly.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    redirect('/portal/login');
  }

  // UI_IMPLEMENTATION_SPRINT_1.md item 1/9 — every role needs to see their
  // own organisation's identity persistently, not just admins. Best-effort:
  // a failure here (network blip) shouldn't take down the whole portal,
  // since the nav already renders fine without it — PortalNav falls back to
  // showing just the product brand if organisationName is null.
  let organisationName = null;
  // CUSTOMER_ONBOARDING_WIZARD_V1.md -- the logo, once uploaded, shows up
  // here too, completing UI_IMPLEMENTATION_SPRINT_1.md's own identity work.
  let hasLogo = false;
  try {
    const token = getSessionToken();
    const organisation = token ? await fetchMyOrganisationIdentity(token) : null;
    organisationName = organisation?.name ?? null;
    hasLogo = Boolean(organisation?.logo_ref);
  } catch {
    organisationName = null;
  }

  // Settings & Security V1 -- Accessibility preferences (Reduce Motion,
  // Larger Text). Best-effort, same posture as the organisation-identity
  // fetch above: a failure here shouldn't take down the whole portal,
  // it just means these two preferences don't apply for this page load.
  let accessibility = { reduce_motion: false, larger_text: false };
  try {
    const token = getSessionToken();
    const settings = token ? await fetchUserSettings(token) : null;
    if (settings?.preferences?.accessibility) {
      accessibility = settings.preferences.accessibility;
    }
  } catch {
    accessibility = { reduce_motion: false, larger_text: false };
  }

  return (
    <AuthProvider initialUser={user}>
      <AccessibilityPreferences reduceMotion={accessibility.reduce_motion} largerText={accessibility.larger_text} />
      <PortalNav organisationName={organisationName} hasLogo={hasLogo} />
      {children}
    </AuthProvider>
  );
}
