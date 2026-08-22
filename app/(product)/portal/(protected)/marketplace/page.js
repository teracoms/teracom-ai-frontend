import { getSessionToken } from '@/lib/api/auth';
import { fetchMarketplacePacks, fetchMarketplaceRecommendations } from '@/lib/api/marketplace';
import { errorMessage } from '@/lib/api/results';
import MarketplacePackCard from '@/components/portal/MarketplacePackCard';
import EmptyState from '@/components/portal/EmptyState';
import WorkforceNav from '@/components/portal/WorkforceNav';

export const metadata = {
  title: 'Marketplace | Teracom AI Portal',
};

const RECOMMENDED_SECTION_LIMIT = 3;

// Foundation screen for Phase 0 Packages D/E — browses Teracom-curated
// Worker Packs (Industry Workforce Packs, per DIGITAL_WORKFORCE_PLATFORM_
// V1.md §14) and, above the full catalogue, a Recommended Worker Packs
// section (RECOMMENDATION_ENGINE_MVP_V1.md) ranked entirely by
// teracom-ai-backend's own local computation — no Intelligence Cloud call
// is involved (see that document's §5). Packs are ungated by default per
// TERACOM_INTELLIGENCE_CLOUD_MVP_V1.md §5; a pack with a `min_tier` still
// appears (with a badge), only its content detail is gated (see
// [slug]/page.js). Per-section resilience (ADR-008): the recommendations
// call and the full-catalogue call are independent — either can fail
// without taking the other section down.
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

  const [packsResult, recommendationsResult] = await Promise.allSettled([
    fetchMarketplacePacks(token),
    fetchMarketplaceRecommendations(token),
  ]);

  const packs = packsResult.status === 'fulfilled' ? packsResult.value : [];
  const loadError = packsResult.status === 'rejected' ? packsResult.reason : null;

  const recommendations =
    recommendationsResult.status === 'fulfilled' ? recommendationsResult.value : null;
  const topRecommended = recommendations?.packs?.slice(0, RECOMMENDED_SECTION_LIMIT) ?? [];

  return (
    <>
      <WorkforceNav />
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

      {topRecommended.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">
                {recommendations.personalized ? 'Recommended for you' : 'Recommended'}
              </span>
              <h2>
                {recommendations.personalized
                  ? 'Matched to your organisation'
                  : 'Featured Worker Packs'}
              </h2>
              {!recommendations.personalized && (
                <p>
                  Upgrade to Enterprise or Platinum for recommendations matched to your
                  organisation&apos;s industry.
                </p>
              )}
            </div>

            <div className="product-grid">
              {topRecommended.map((pack) => (
                <MarketplacePackCard key={pack.id} pack={pack} rationale={pack.rationale} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">All packs</span>
            <h2>Full Marketplace catalogue</h2>
          </div>

          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : packs.length === 0 ? (
            <EmptyState
              title="No packs published yet"
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

      <section className="section alt">
        <div className="container">
          <p className="form-note">
            Every pack here runs on Teracom AI — part of the Teracom AI product family, specialist
            platforms built for different parts of the business.
          </p>
          <div className="mini-services">
            <span>SecurityOS — available now</span>
            <span>FinanceOS — coming soon</span>
            <span>OperationsOS — coming soon</span>
            <span>ElectricalOS — coming soon</span>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
