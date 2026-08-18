import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getPortalContactSession } from '@/lib/api/portalContactAuth';
import PortalContactLoginForm from '@/components/customer-portal/PortalContactLoginForm';

export const metadata = {
  title: 'Sign In | Teracom AI Customer Portal',
};

function resolveNextPath(searchParams) {
  const next = searchParams?.next;
  if (typeof next === 'string' && next.startsWith('/')) {
    return next;
  }
  return '/customer-portal';
}

export default async function CustomerPortalLoginPage({ searchParams }) {
  const nextPath = resolveNextPath(searchParams);

  let portalContact = null;
  try {
    portalContact = await getPortalContactSession();
  } catch {
    portalContact = null;
  }

  if (portalContact) {
    redirect(nextPath);
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Teracom AI Customer Portal</span>
            <h1>Sign in to your account.</h1>
            <p className="lead">
              View your proposals, projects, and support requests — your dedicated view into the
              work Teracom AI is delivering for your organisation.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="auth-card">
            <PortalContactLoginForm nextPath={nextPath} />
            <p className="form-note" style={{ marginTop: '16px' }}>
              <Link href="/customer-portal/forgot-password">Forgot password?</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
