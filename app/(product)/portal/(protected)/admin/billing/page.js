import Link from 'next/link';

import { getReferenceLicence, withPreviewState } from '@/lib/licensing/referenceLicence';
import StatTile from '@/components/portal/StatTile';
import { BillingIcon, CpuIcon, ClockIcon } from '@/components/portal/icons';

export const metadata = {
  title: 'Billing & Licensing | Teracom AI Portal',
};

const PREVIEW_LINKS = [
  { state: 'active', label: 'Active (real default)' },
  { state: 'grace', label: 'Preview: Grace Period' },
  { state: 'locked', label: 'Preview: Locked Mode' },
];

/**
 * Requirements #1 (Overview), #7 (Grace Period Experience), and #8 (Locked
 * Mode Experience) are all one page here, switched by an explicit
 * `?preview=` query param — not by comparing the reference licence's
 * `expiryDate` against the real clock. See lib/licensing/referenceLicence.js
 * for why: this section's demonstrated state must not silently change on
 * its own as real time passes, and this frontend does not fabricate a real
 * licence-validity check the backend has no data to support (see
 * BILLING_AND_LICENSING_IMPLEMENTATION_REPORT.md §2/§8). "Locked Mode" here
 * is a preview of the experience, not real enforcement — it does not gate
 * `/portal/**`, since no backend signal exists to drive that safely.
 */
export default function BillingOverviewPage({ searchParams }) {
  const previewState = ['grace', 'locked'].includes(searchParams?.preview)
    ? searchParams.preview
    : 'active';

  const licence = withPreviewState(getReferenceLicence(), previewState);
  const isPreview = previewState !== 'active';

  if (licence.status === 'locked') {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="preview-banner" role="note">
              Preview only — this is what Locked Mode would look like once a licence lapses past
              its grace period. It does not restrict access to the rest of this portal today,
              since no backend licence-validity check exists yet to drive that safely. See{' '}
              <Link href="/portal/admin/billing">exit preview</Link>.
            </p>

            <div className="locked-mode-screen">
              <span className="eyebrow">Locked Mode</span>
              <h2>A valid licence is required to continue.</h2>
              <p className="lead">
                Only licence management functions remain available in Locked Mode — chat, worker
                management, knowledge, and administration are inaccessible until a valid licence
                is uploaded and accepted.
              </p>
              <div className="hero-actions locked-mode-actions">
                <Link className="btn btn-primary" href="/portal/admin/billing/renewal">
                  Request Renewal
                </Link>
                <Link className="btn btn-secondary" href="/portal/admin/billing/licence">
                  View Licence Details
                </Link>
              </div>
            </div>
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
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Licence overview.</h1>
            <p className="lead">
              Tier, hosting model, status, and what needs your attention next.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {isPreview && (
            <p className="preview-banner" role="note">
              Preview only — showing the Grace Period experience with illustrative data. See{' '}
              <Link href="/portal/admin/billing">exit preview</Link>.
            </p>
          )}

          {licence.status === 'grace' && (
            <p className="form-error" role="alert">
              Your licence expired and is now in a 30-day grace period —{' '}
              {licence.daysRemainingInGracePeriod} days remaining. Login, data export, uploading a
              replacement licence, and requesting renewal all remain available.
            </p>
          )}

          <div className="stat-grid">
            <StatTile label="Tier" value={licence.tier} icon={<BillingIcon />} />
            <StatTile label="Hosting Model" value={licence.hostingModel} icon={<CpuIcon />} />
            <StatTile label="Licence Status" value={licence.status} icon={<BillingIcon />} />
            <StatTile label="Expiry Date" value={licence.expiryDate} icon={<ClockIcon />} />
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Next required action</span>
            <h2>{licence.nextRequiredAction ?? 'Nothing needs your attention right now.'}</h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Recent events</span>
            <h2>Licence history.</h2>
          </div>
          <ul className="activity-list">
            {licence.recentEvents.map((event) => (
              <li key={event.date + event.description}>
                <p className="activity-title">{event.description}</p>
                <p className="activity-meta">{event.date}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Preview other states</span>
            <h2>See the Grace Period and Locked Mode experiences.</h2>
          </div>
          <div className="hero-actions">
            {PREVIEW_LINKS.map((link) => (
              <Link
                key={link.state}
                className={link.state === previewState ? 'btn btn-primary' : 'btn btn-secondary'}
                href={link.state === 'active' ? '/portal/admin/billing' : `/portal/admin/billing?preview=${link.state}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
