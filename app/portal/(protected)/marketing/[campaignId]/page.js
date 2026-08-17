import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchCampaign } from '@/lib/api/marketing';
import { fetchContent, fetchVideo } from '@/lib/api/marketingProduction';
import { fetchWorkerList } from '@/lib/api/workers';
import { settle, errorMessage } from '@/lib/api/results';
import CampaignDetail from '@/components/portal/CampaignDetail';
import ContentPiecePanel from '@/components/portal/ContentPiecePanel';
import VideoAssetPanel from '@/components/portal/VideoAssetPanel';

export const metadata = {
  title: 'Campaign | Teracom AI Portal',
};

/**
 * Campaign detail (Phase 0 Package K): stage control, content production
 * (objective #6), and video production (objective #7) — the concrete
 * Marketing Manager -> Content Producer -> Video Producer pipeline
 * (objective #12), each requiring human approval (governance, ADR-015).
 */
export default async function CampaignDetailPage({ params }) {
  const { campaignId } = params;
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Campaign</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view this campaign.</p>
          </div>
        </section>
      </main>
    );
  }

  const [campaignResult, contentResult, videoResult, workersResult] = await Promise.allSettled([
    fetchCampaign(token, campaignId),
    fetchContent(token, campaignId),
    fetchVideo(token, campaignId),
    fetchWorkerList(token),
  ]);

  const campaign = settle(campaignResult);

  if (campaign.error) {
    const notFound = campaign.error instanceof ApiError && [403, 404].includes(campaign.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Campaign</span>
            <h1>{notFound ? 'Campaign not found.' : 'Unable to load this campaign.'}</h1>
            <p className="lead">
              {notFound
                ? "This campaign doesn't exist, or belongs to a different organisation."
                : errorMessage(campaign.error)}
            </p>
            <Link className="btn btn-secondary" href="/portal/marketing">
              Back to Marketing
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const content = settle(contentResult);
  const video = settle(videoResult);
  const workers = settle(workersResult);
  const activeWorkers = (workers.value ?? []).filter((worker) => worker.status === 'active');
  const approvedContentPieces = (content.value ?? []).filter((piece) => piece.status === 'approved');

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Campaign</span>
            <h1>{campaign.value.name}</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CampaignDetail campaign={campaign.value} />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {content.error ? (
            <p className="form-error" role="alert">
              {errorMessage(content.error)}
            </p>
          ) : (
            <ContentPiecePanel campaignId={campaignId} contentPieces={content.value ?? []} workers={activeWorkers} />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {video.error ? (
            <p className="form-error" role="alert">
              {errorMessage(video.error)}
            </p>
          ) : (
            <VideoAssetPanel
              campaignId={campaignId}
              videoAssets={video.value ?? []}
              workers={activeWorkers}
              approvedContentPieces={approvedContentPieces}
            />
          )}
        </div>
      </section>
    </main>
  );
}
