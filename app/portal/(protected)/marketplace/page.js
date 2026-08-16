import { getSessionToken } from '@/lib/api/auth';
import { fetchMarketplacePacks } from '@/lib/api/marketplace';
import { errorMessage } from '@/lib/api/results';
import MarketplacePackCard from '@/components/portal/MarketplacePackCard';
import EmptyState from '@/components/portal/EmptyState';

export const metadata = {
  title: 'Marketplace | Teracom AI Portal',
};

// Foundation screen for Phase 0 Package D — browses Teracom-curated Worker
// Packs (Industry Workforce Packs, per DIGITAL_WORKFORCE_PLATFORM_V1.md §14),
// ungated by default per TERACOM_INTELLIGENCE_CLOUD_MVP_V1.md §5; a pack with
// a `min_tier` still appears here (with a badge), only its content detail is
// gated (see [slug]/page.js). This is a browsing foundation, not a wizard —
// there is nothing to configure yet, so Forms-Last's simplest tier (a plain
// list) is the right fit per UX_VISION.md's evaluation order.
export default async function MarketplacePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Marketplace</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to browse the Marketplace.</p>
          </div>
        </section>
      </main>
    );
  }

  let packs = [];
  let loadError = null;

  try {
    packs = await fetchMarketplacePacks(token);
  } catch (error) {
    loadError = error;
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Marketplace</span>
            <h1>Curated Worker Packs.</h1>
            <p className="lead">
              Browse Teracom-curated bundles of AI worker personas for your industry — each
              pack is a starting point you can adapt, not a fixed configuration.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : packs.length === 0 ? (
            <EmptyState
              title="No packs published yet."
              description="Check back soon — Teracom's curation team is preparing the first Worker Packs."
            />
          ) : (
            <div className="product-grid">
              {packs.map((pack) => (
                <MarketplacePackCard key={pack.id} pack={pack} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
