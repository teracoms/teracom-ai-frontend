import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';

export const metadata = {
  title: 'Installed Operating Systems | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- "Under My Organisation,
 * create an Installed Operating Systems area." No real Operating-System-
 * provisioning/entitlement registry exists in this backend today (Software
 * Development OS and Cybersecurity OS are Marketplace-published packs,
 * never live-provisioned into any customer organisation -- confirmed
 * directly, not assumed). Technical Support OS is the one real, working
 * module this page links to; the other two are named honestly as not yet
 * provisioned rather than given a fabricated dashboard.
 */
export default async function OperatingSystemsPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">My Organisation</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view installed Operating Systems.</p>
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
            <span className="eyebrow">My Organisation</span>
            <h1>Installed Operating Systems.</h1>
            <p className="lead">
              Each Operating System is a self-contained module — its own dashboard, workers,
              workflows, conversations, knowledge, and reports.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container product-grid">
          <article className="product-card">
            <div>
              <span className="badge">Real</span>
              <h3>Technical Support OS</h3>
              <p>
                Vendor documentation discovery, technical knowledge, support cases, and a
                worker-answered chat interface grounded in ingested vendor documents.
              </p>
            </div>
            <Link className="btn btn-primary" href="/portal/operating-systems/technical-support">
              Open Technical Support OS
            </Link>
          </article>

          <article className="product-card connector-card">
            <div>
              <span className="badge">Not Provisioned</span>
              <h3>Software Development OS</h3>
              <p>
                A published Marketplace product (Department Pack composition, per this
                platform&apos;s own Operating System Product Framework) — not yet provisioned
                for this organisation. No live dashboard exists here until it is.
              </p>
            </div>
            <Link className="btn btn-secondary" href="/portal/marketplace">
              View in Marketplace
            </Link>
          </article>

          <article className="product-card connector-card">
            <div>
              <span className="badge">Not Provisioned</span>
              <h3>Cybersecurity OS</h3>
              <p>
                A named product composition — not yet provisioned for this organisation. No
                live dashboard exists here until it is.
              </p>
            </div>
            <Link className="btn btn-secondary" href="/portal/marketplace">
              View in Marketplace
            </Link>
          </article>

          <article className="product-card connector-card">
            <div>
              <span className="badge">Coming Soon</span>
              <h3>Other installed Operating Systems</h3>
              <p>
                Additional Operating Systems your organisation licenses will appear here once a
                real provisioning mechanism exists for them.
              </p>
            </div>
            <Link className="btn btn-secondary" href="/portal/marketplace">
              Browse Marketplace
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
