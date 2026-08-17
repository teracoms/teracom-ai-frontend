import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import {
  fetchPortalContactProposals,
  fetchPortalContactQuotes,
  fetchPortalContactContracts,
} from '@/lib/api/portalContactDeals';
import { settle, errorMessage } from '@/lib/api/results';
import PortalDealsView from '@/components/customer-portal/PortalDealsView';

export const metadata = {
  title: 'Proposals & Contracts | Customer Portal',
};

export default async function CustomerPortalDealsPage() {
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

  const [proposalsSettled, quotesSettled, contractsSettled] = await Promise.allSettled([
    fetchPortalContactProposals(token),
    fetchPortalContactQuotes(token),
    fetchPortalContactContracts(token),
  ]);

  const proposals = settle(proposalsSettled);
  const quotes = settle(quotesSettled);
  const contracts = settle(contractsSettled);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Customer Portal</span>
            <h1>Proposals, quotes &amp; contracts.</h1>
            <p className="lead">Read-only — approvals remain with your Teracom AI account team.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {proposals.error || quotes.error || contracts.error ? (
            <p className="form-error" role="alert">
              {errorMessage(proposals.error ?? quotes.error ?? contracts.error)}
            </p>
          ) : (
            <PortalDealsView
              proposals={proposals.value ?? []}
              quotes={quotes.value ?? []}
              contracts={contracts.value ?? []}
            />
          )}
        </div>
      </section>
    </main>
  );
}
