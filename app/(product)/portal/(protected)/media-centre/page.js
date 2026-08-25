import { getSessionToken } from '@/lib/api/auth';
import { fetchCampaigns } from '@/lib/api/marketing';
import { fetchContent, fetchVideo } from '@/lib/api/marketingProduction';
import { fetchMediaCentreItems } from '@/lib/api/mediaCentre';
import { settle, errorMessage } from '@/lib/api/results';
import MediaCentreView from '@/components/portal/MediaCentreView';
import MyOrganisationNav from '@/components/portal/MyOrganisationNav';

export const metadata = {
  title: 'Media Centre | Teracom AI Portal',
};

/**
 * The Media Centre foundation workspace (Phase 0 Package K, objective
 * #8). Content/video list endpoints are per-campaign (no org-wide list
 * endpoint exists), so the approved-source pickers are built by fetching
 * every campaign's own content/video and filtering to `status ===
 * "approved"` — a foundation-stage approach, not a new backend endpoint.
 */
export default async function MediaCentrePage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Media Centre</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the Media Centre.</p>
          </div>
        </section>
      </main>
    );
  }

  const [itemsSettled, campaignsSettled] = await Promise.allSettled([
    fetchMediaCentreItems(token),
    fetchCampaigns(token),
  ]);

  const items = settle(itemsSettled);
  const campaigns = settle(campaignsSettled);

  const perCampaign = await Promise.allSettled(
    (campaigns.value ?? []).flatMap((campaign) => [
      fetchContent(token, campaign.id),
      fetchVideo(token, campaign.id),
    ])
  );

  const approvedContentPieces = [];
  const approvedVideoAssets = [];
  perCampaign.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const isContent = index % 2 === 0;
    const approved = result.value.filter((item) => item.status === 'approved');
    if (isContent) approvedContentPieces.push(...approved);
    else approvedVideoAssets.push(...approved);
  });

  return (
    <>
      <MyOrganisationNav />
      <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Media Centre</span>
            <h1>Publication foundation.</h1>
            <p className="lead">
              Publish approved content and video into the Media Centre, then mark each item
              published once it is live.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {items.error ? (
            <p className="form-error" role="alert">
              {errorMessage(items.error)}
            </p>
          ) : (
            <MediaCentreView
              items={items.value ?? []}
              approvedContentPieces={approvedContentPieces}
              approvedVideoAssets={approvedVideoAssets}
            />
          )}
        </div>
      </section>
    </main>
    </>
  );
}
