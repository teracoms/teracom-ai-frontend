import { getSessionToken } from '@/lib/api/auth';
import { fetchCampaigns } from '@/lib/api/marketing';
import { settle, errorMessage } from '@/lib/api/results';
import CampaignForm from '@/components/portal/CampaignForm';
import CampaignListView from '@/components/portal/CampaignListView';

export const metadata = {
  title: 'Marketing | Teracom AI Portal',
};

const VALID_STAGES = ['planning', 'active', 'completed'];

/**
 * The Marketing Manager workspace (Phase 0 Package K): campaign
 * management (objective #5), stage-filterable.
 */
export default async function MarketingPage({ searchParams }) {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Marketing</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view the marketing workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  const stage = VALID_STAGES.includes(searchParams?.stage) ? searchParams.stage : undefined;

  const [campaignsSettled] = await Promise.allSettled([fetchCampaigns(token, stage)]);
  const campaigns = settle(campaignsSettled);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Marketing</span>
            <h1>Campaigns, content, and video production.</h1>
            <p className="lead">
              The Marketing Manager workspace — create a campaign and manage content and video
              production from each campaign&apos;s own page.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">New</span>
            <h2>Create a campaign.</h2>
          </div>
          <CampaignForm />
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          {campaigns.error ? (
            <p className="form-error" role="alert">
              {errorMessage(campaigns.error)}
            </p>
          ) : (
            <CampaignListView campaigns={campaigns.value ?? []} activeStage={stage} />
          )}
        </div>
      </section>
    </main>
  );
}
