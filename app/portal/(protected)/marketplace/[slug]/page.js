import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSessionToken } from '@/lib/api/auth';
import { fetchMarketplacePackDetail } from '@/lib/api/marketplace';
import { ApiError } from '@/lib/api/client';
import { errorMessage, isForbidden } from '@/lib/api/results';

export async function generateMetadata({ params }) {
  return { title: `${params.slug} | Marketplace | Teracom AI Portal` };
}

// Worker Pack catalogue foundation (Phase 0 Package D) — the enforcement
// point for a gated pack's entitlement check (backend §
// PHASE_0_PACKAGE_D_MARKETPLACE_IMPLEMENTATION_REPORT.md §6): a 403 here is
// an expected, real outcome for a pack whose min_tier the organisation's
// current licence doesn't meet, not an error to hide.
export default async function MarketplacePackDetailPage({ params }) {
  const { slug } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Marketplace</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this pack.</p>
          </div>
        </section>
      </main>
    );
  }

  let pack = null;
  let forbiddenReason = null;
  let loadError = null;

  try {
    pack = await fetchMarketplacePackDetail(token, slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    } else if (isForbidden(error)) {
      forbiddenReason = errorMessage(error);
    } else {
      loadError = error;
    }
  }

  if (loadError) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Marketplace</span>
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (forbiddenReason) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Marketplace</span>
            <h1>This pack requires a higher licence tier.</h1>
            <p className="lead">{forbiddenReason}</p>
            <Link className="btn btn-secondary" href="/portal/marketplace">
              Back to Marketplace
            </Link>
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
            <span className="eyebrow">{pack.industry}</span>
            <h1>{pack.name}</h1>
            <p className="lead">{pack.description}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Included personas</span>
            <h2>{pack.persona_templates.length} worker templates in this pack</h2>
            <p>
              Each template is a starting point — create a worker from this catalogue and adjust
              its name, purpose or instructions to fit your organisation.
            </p>
          </div>

          <div className="product-grid">
            {pack.persona_templates.map((template) => (
              <article className="product-card" key={template.name}>
                <div>
                  <span className="badge">{template.role}</span>
                  <h3>{template.name}</h3>
                  <p>{template.purpose}</p>
                </div>
              </article>
            ))}
          </div>

          <p>
            <Link className="btn btn-secondary" href="/portal/marketplace">
              Back to Marketplace
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
