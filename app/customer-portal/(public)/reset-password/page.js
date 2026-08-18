import Link from 'next/link';

import PortalContactResetPasswordForm from '@/components/customer-portal/PortalContactResetPasswordForm';

export const metadata = {
  title: 'Reset Password | Customer Portal',
};

export default function CustomerPortalResetPasswordPage({ searchParams }) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : '';

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Customer Portal</span>
            <h1>Set a new password.</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="auth-card">
            {token ? (
              <PortalContactResetPasswordForm token={token} />
            ) : (
              <p className="form-error" role="alert">
                This reset link is missing its token. Please use the link from your password reset
                email, or request a new one.
              </p>
            )}
            <p className="form-note" style={{ marginTop: '20px' }}>
              <Link href="/customer-portal/forgot-password">Request a new reset link</Link> ·{' '}
              <Link href="/customer-portal/login">Back to sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
