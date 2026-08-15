import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/api/auth';
import LoginForm from '@/components/portal/LoginForm';

export const metadata = {
  title: 'Sign In | Teracom AI Portal',
};

function resolveNextPath(searchParams) {
  const next = searchParams?.next;
  if (typeof next === 'string' && next.startsWith('/')) {
    return next;
  }
  return '/portal';
}

export default async function LoginPage({ searchParams }) {
  const nextPath = resolveNextPath(searchParams);

  // Already signed in with a valid session — no reason to show the form.
  let user = null;
  try {
    user = await getSessionUser();
  } catch {
    // Backend unreachable: fall through and show the login form as normal;
    // the form submission itself will surface the "unable to reach backend"
    // error if it's still down.
    user = null;
  }

  if (user) {
    redirect(nextPath);
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Teracom AI Portal</span>
            <h1>Sign in to your workspace.</h1>
            <p className="lead">
              Access SecurityOS AI workers, knowledge and conversations for your organisation.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="auth-card">
            <LoginForm nextPath={nextPath} />
          </div>
        </div>
      </section>
    </main>
  );
}
