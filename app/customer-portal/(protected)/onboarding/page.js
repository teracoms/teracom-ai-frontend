import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { fetchPortalContactOnboardingTasks } from '@/lib/api/portalContactOnboarding';
import { errorMessage } from '@/lib/api/results';
import PortalOnboardingView from '@/components/customer-portal/PortalOnboardingView';

export const metadata = {
  title: 'Onboarding | Teracom AI Customer Portal',
};

export default async function CustomerPortalOnboardingPage() {
  const token = getPortalContactSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Customer Portal</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  let tasks;
  try {
    tasks = await fetchPortalContactOnboardingTasks(token);
  } catch (error) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="form-error" role="alert">
              {errorMessage(error)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Customer Portal</span>
            <h1>Your Onboarding Progress.</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PortalOnboardingView tasks={tasks ?? []} />
        </div>
      </section>
    </main>
  );
}
