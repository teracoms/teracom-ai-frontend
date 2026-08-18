import Link from 'next/link';

import PortalContactForgotPasswordForm from '@/components/customer-portal/PortalContactForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password | Teracom AI Customer Portal',
};

export default function CustomerPortalForgotPasswordPage() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Customer Portal</span>
            <h1>Reset your password.</h1>
            <p className="lead">
              Enter the email on your account and we&apos;ll send instructions to reset your
              password.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="auth-card">
            <PortalContactForgotPasswordForm />
            <p className="form-note" style={{ marginTop: '20px' }}>
              <Link href="/customer-portal/login">Back to sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
