import { redirect } from 'next/navigation';

import { getPortalContactSession } from '@/lib/api/portalContactAuth';
import { PortalContactAuthProvider } from '@/components/customer-portal/PortalContactAuthProvider';
import CustomerPortalNav from '@/components/customer-portal/CustomerPortalNav';

// Authoritative session guard for every /customer-portal route except
// /customer-portal/login — mirrors app/portal/(protected)/layout.js exactly,
// but for the portal-contact session plane (GET /portal-contact/me).
export default async function ProtectedCustomerPortalLayout({ children }) {
  let portalContact = null;

  try {
    portalContact = await getPortalContactSession();
  } catch {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Customer Portal unavailable</span>
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

  if (!portalContact) {
    redirect('/customer-portal/login');
  }

  return (
    <PortalContactAuthProvider initialPortalContact={portalContact}>
      <CustomerPortalNav />
      {children}
    </PortalContactAuthProvider>
  );
}
