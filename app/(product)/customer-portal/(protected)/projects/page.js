import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { fetchPortalContactProjects } from '@/lib/api/portalContactProjects';
import { errorMessage } from '@/lib/api/results';
import PortalProjectsView from '@/components/customer-portal/PortalProjectsView';

export const metadata = {
  title: 'Projects | Teracom AI Customer Portal',
};

export default async function CustomerPortalProjectsPage() {
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

  let projects;
  try {
    projects = await fetchPortalContactProjects(token);
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
            <h1>Project delivery progress.</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PortalProjectsView projects={projects ?? []} />
        </div>
      </section>
    </main>
  );
}
