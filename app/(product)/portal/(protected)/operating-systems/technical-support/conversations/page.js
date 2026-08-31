import Link from 'next/link';

import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';

export const metadata = {
  title: 'Support Conversations | Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- reuses the real, existing
 * /portal/chat mechanism rather than building a parallel conversation
 * surface. No real per-worker/per-OS chat filter exists in this frontend
 * today (confirmed by checking chat/page.js directly), so this links
 * honestly into the existing chat rather than implying a scoped view that
 * isn't real.
 */
export default function SupportConversationsPage() {
  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Support Conversations</h1>
              <p className="lead">
                Ask a Technical Support Worker a question — it answers grounded in the vendor
                documents ingested under Vendor Sources, with the source document named
                alongside the answer.
              </p>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/portal/chat">
                Open Chat
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <p className="form-note">
              This links into the platform&apos;s existing chat surface — there is no
              Technical-Support-specific chat view yet. Pick a worker listed under{' '}
              <Link href="/portal/operating-systems/technical-support/workers">Technical Support Workers</Link>{' '}
              to get an answer grounded in that worker&apos;s own ingested vendor documents.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
