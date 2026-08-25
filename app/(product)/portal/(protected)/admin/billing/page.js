import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchFinanceSummary } from '@/lib/api/finance';
import { getReferenceLicence, withPreviewState, GRACE_PERIOD_DAYS } from '@/lib/licensing/referenceLicence';
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
 * CUSTOMER_PLATFORM_UX_REFACTOR_V1 -- fixes the High-priority finding
 * UX_REVIEW_CUSTOMER_PLATFORM_V1.md §H1 named: this page used to render
 * `getReferenceLicence()`'s hardcoded example data with no signal that it
 * wasn't the organisation's real licence. It now follows the same
 * real-data-first, illustrative-fallback pattern
 * app/portal/(protected)/admin/billing/usage/page.js and
 * app/portal/(protected)/admin/billing/licence/page.js already established
 * (GET /finance/summary's `licensing` field, real since backend Packages
 * A-D) -- this was the one consumer of `getReferenceLicence()` in the
 * section that hadn't yet been brought in line with it.
 *
 * Real/grace/locked status is derived here from `days_until_expiry` using
 * the same day-math LICENCE_GRACE_PERIOD_DAYS (config.py, 30 days,
 * mirrored by GRACE_PERIOD_DAYS here) that
 * services/licence_validation_service.py#validate_licence() applies to a
 * signed offline token -- a pure, additive frontend computation over an
 * already-real number, not a new backend capability or a fabricated check.
 *
 * The `?preview=` mechanism is unchanged and still operates on the
 * reference licence only (never on real data) -- previewing a hypothetical
 * Grace/Locked experience remains available even for an organisation with
 * a real, currently-active licence, but is now explicitly labelled as a
 * preview of another organisation's possible future, not this one's
 * current status.
 */
export default async function BillingOverviewPage({ searchParams }) {
  const previewState = ['grace', 'locked'].includes(searchParams?.preview)
    ? searchParams.preview
    : 'active';
  const isPreview = previewState !== 'active';

  const token = getSessionToken();
  let licensing = null;
  if (token) {
    try {
      const finance = await fetchFinanceSummary(token);
      licensing = finance?.licensing ?? null;
    } catch {
      // Non-fatal: falls back to the illustrative reference licence below,
      // same resilience posture as every other per-section fetch in this
      // app -- one failed call never blocks the rest of the page.
    }
  }

  // Preview mode always renders the reference licence, real licence or not
  // -- see the docstring above for why.
  if (isPreview) {
    const licence = withPreviewState(getReferenceLicence(), previewState);
    return renderPreview(licence, previewState);
  }

  if (licensing) {
    return renderReal(licensing);
  }

  return renderIllustrative(getReferenceLicence());
}

function deriveRealStatus(licensing) {
  const daysUntilExpiry = licensing.days_until_expiry;
  if (daysUntilExpiry == null) return { status: 'active', daysRemainingInGracePeriod: null };
  if (daysUntilExpiry >= 0) return { status: 'active', daysRemainingInGracePeriod: null };
  const daysRemainingInGracePeriod = GRACE_PERIOD_DAYS + daysUntilExpiry;
  if (daysRemainingInGracePeriod > 0) return { status: 'grace', daysRemainingInGracePeriod };
  return { status: 'locked', daysRemainingInGracePeriod: 0 };
}

function renderReal(licensing) {
  const { status, daysRemainingInGracePeriod } = deriveRealStatus(licensing);
  const expiryDate = licensing.expires_at ? licensing.expires_at.slice(0, 10) : 'No expiry set';

  if (status === 'locked') {
    return (
      <main>
        <section className="section">
          <div className="container">
            <div className="locked-mode-screen">
              <span className="eyebrow">Locked Mode</span>
              <h2>A valid licence is required to continue.</h2>
              <p className="lead">
                Your organisation&apos;s licence expired on {expiryDate} and its 30-day grace
                period has now ended. Only licence management functions remain available until a
                valid licence is uploaded and accepted.
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

  const nextRequiredAction =
    status === 'grace'
      ? `Renew now -- ${daysRemainingInGracePeriod} day(s) remain in your grace period before this organisation enters Locked Mode.`
      : licensing.expiring_soon
        ? `Renew before ${expiryDate} -- your licence expires in ${licensing.days_until_expiry} day(s).`
        : 'Nothing needs your attention right now.';

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Licence overview.</h1>
            <p className="lead">Real, current licence status for your organisation.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {status === 'grace' && (
            <p className="form-error" role="alert">
              Your licence expired and is now in a grace period -- {daysRemainingInGracePeriod}{' '}
              day(s) remaining. Login, data export, uploading a replacement licence, and
              requesting renewal all remain available.
            </p>
          )}

          <div className="stat-grid">
            <StatTile label="Tier" value={licensing.tier} icon={<BillingIcon />} />
            <StatTile label="Hosting Model" value={licensing.hosting_model} icon={<CpuIcon />} />
            <StatTile label="Licence Status" value={status} icon={<BillingIcon />} />
            <StatTile label="Expiry Date" value={expiryDate} icon={<ClockIcon />} />
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Next required action</span>
            <h2>{nextRequiredAction}</h2>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Usage against this licence</span>
            <h2>See the real, current worker and user counts.</h2>
          </div>
          <p className="activity-meta">
            {licensing.worker_count} of {licensing.worker_limit ?? '—'} worker(s) used
            {licensing.worker_utilisation_percent != null ? ` (${licensing.worker_utilisation_percent}%)` : ''}.
          </p>
          <p className="activity-meta" style={{ marginBottom: '1rem' }}>
            {licensing.user_count} of {licensing.user_limit ?? '—'} user(s) used
            {licensing.user_utilisation_percent != null ? ` (${licensing.user_utilisation_percent}%)` : ''}.
          </p>
          <Link className="btn btn-secondary btn-small" href="/portal/admin/billing/usage">
            View full Usage &amp; Capacity
          </Link>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Licence history</span>
            <h2>Every request and approval for this organisation.</h2>
          </div>
          <Link className="btn btn-secondary btn-small" href="/portal/admin/billing/requests">
            View Requests &amp; History
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Preview other states</span>
            <h2>See what Grace Period and Locked Mode look like.</h2>
          </div>
          <p className="activity-meta" style={{ marginBottom: '1rem' }}>
            These are illustrative previews of another organisation&apos;s possible future state --
            not a forecast of this organisation&apos;s own licence, which is currently {status}.
          </p>
          <div className="hero-actions">
            {PREVIEW_LINKS.filter((link) => link.state !== 'active').map((link) => (
              <Link key={link.state} className="btn btn-secondary" href={`/portal/admin/billing?preview=${link.state}`}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function renderIllustrative(licence) {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Billing &amp; Licensing</span>
            <h1>Licence overview.</h1>
            <p className="lead">Tier, hosting model, status, and what needs your attention next.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="illustrative-data-banner" role="note">
            <strong>Illustrative data</strong>
            No licence has been issued to your organisation yet, so this shows an example{' '}
            {licence.tier}-tier licence instead. Real, current data will replace it automatically
            once your organisation has an active licence -- see{' '}
            <Link href="/portal/admin/billing/requests">Requests &amp; History</Link> to check on
            a pending request.
          </p>

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
                className={link.state === 'active' ? 'btn btn-primary' : 'btn btn-secondary'}
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

function renderPreview(licence, previewState) {
  if (licence.status === 'locked') {
    return (
      <main>
        <section className="section">
          <div className="container">
            <p className="preview-banner" role="note">
              Preview only -- this is what Locked Mode would look like once a licence lapses past
              its grace period. It does not restrict access to the rest of this portal today,
              since no backend licence-validity check exists yet to drive that safely. See{' '}
              <Link href="/portal/admin/billing">exit preview</Link>.
            </p>

            <div className="locked-mode-screen">
              <span className="eyebrow">Locked Mode</span>
              <h2>A valid licence is required to continue.</h2>
              <p className="lead">
                Only licence management functions remain available in Locked Mode -- chat, worker
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
            <p className="lead">Tier, hosting model, status, and what needs your attention next.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="preview-banner" role="note">
            Preview only -- showing the Grace Period experience with illustrative data. See{' '}
            <Link href="/portal/admin/billing">exit preview</Link>.
          </p>

          {licence.status === 'grace' && (
            <p className="form-error" role="alert">
              Your licence expired and is now in a 30-day grace period --{' '}
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
