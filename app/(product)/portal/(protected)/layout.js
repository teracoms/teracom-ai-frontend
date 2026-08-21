import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/api/auth';
import { AuthProvider } from '@/components/portal/AuthProvider';
import PortalNav from '@/components/portal/PortalNav';

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

  return (
    <AuthProvider initialUser={user}>
      <PortalNav />
      {children}
    </AuthProvider>
  );
}
