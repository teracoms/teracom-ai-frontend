import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/api/auth';
import LoginForm from '@/components/portal/LoginForm';
import AiConciergePlaceholder from '@/components/portal/AiConciergePlaceholder';

export const metadata = {
  title: 'Sign In | Teracom AI Portal',
};

function resolveNextPath(searchParams) {
  const next = searchParams?.next;
  if (typeof next === 'string' && next.startsWith('/')) {
    return next;
  }
  return '/portal/dashboard';
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
              Access your Teracom AI Workforce — workers, knowledge and conversations for your
              organisation.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="auth-card">
            <LoginForm nextPath={nextPath} />
            <p className="form-note" style={{ marginTop: '16px' }}>
              <Link href="/portal/forgot-password">Forgot password?</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">New to Teracom AI</span>
            <h2>Not signed up yet?</h2>
          </div>
          <div className="login-actions-grid">
            <article className="login-action-card">
              <h3>Start Trial</h3>
              <p>Spin up your own workspace in minutes. No credit card required.</p>
              <Link className="btn btn-primary card-action" href="/portal/start-trial">
                Start free trial
              </Link>
            </article>
            <article className="login-action-card">
              <h3>Request Demo</h3>
              <p>See Teracom AI Workforce in action, guided by our team.</p>
              <Link className="btn btn-secondary card-action" href="/?interest=Request+Demo#contact">
                Request a demo
              </Link>
            </article>
            <article className="login-action-card">
              <h3>Contact Sales</h3>
              <p>Talk to us about tiers, hosting models and rollout for your organisation.</p>
              <Link className="btn btn-secondary card-action" href="/?interest=Talk+to+Sales#contact">
                Contact sales
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <AiConciergePlaceholder />
        </div>
      </section>
    </main>
  );
}
