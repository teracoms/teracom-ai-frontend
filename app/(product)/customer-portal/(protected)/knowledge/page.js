import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { fetchPortalContactKnowledge } from '@/lib/api/portalContactKnowledge';
import { errorMessage } from '@/lib/api/results';
import PortalKnowledgeList from '@/components/customer-portal/PortalKnowledgeList';

export const metadata = {
  title: 'Knowledge | Teracom AI Customer Portal',
};

export default async function CustomerPortalKnowledgePage() {
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

  let articles;
  try {
    articles = await fetchPortalContactKnowledge(token);
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
            <h1>Knowledge base.</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PortalKnowledgeList articles={articles ?? []} />
        </div>
      </section>
    </main>
  );
}
