import Link from 'next/link';

import TrialSignupForm from '@/components/portal/TrialSignupForm';

export const metadata = {
  title: 'Start Trial | Teracom AI',
};

export default function StartTrialPage() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Teracom AI Workforce</span>
            <h1>Start your trial.</h1>
            <p className="lead">
              Spin up your own Teracom AI Workforce workspace in minutes. No credit card required.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="auth-card">
            <TrialSignupForm />
            <p className="form-note" style={{ marginTop: '20px' }}>
              Already have an account? <Link href="/portal/login">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
