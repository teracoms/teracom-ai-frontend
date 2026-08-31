import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchVendorSources } from '@/lib/api/vendorSources';
import { fetchWorkerPersonality } from '@/lib/api/workerPersonality';
import { settle, errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';
import AvatarPanel from '@/components/portal/AvatarPanel';

export const metadata = {
  title: 'Worker Avatar | Technical Support OS | Teracom AI Portal',
};

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- real avatar overview,
// replacing the prior honest placeholder now that
// /workers/{id}/personality is real (teracom-ai-backend 428b3b2).
// Reuses the same "workers assigned to a vendor source" derivation
// workers/page.js already established, one AvatarPanel per worker
// (real placeholder or real uploaded-image rendering), linking into
// the real per-worker configure screen.
export default async function TechnicalSupportAvatarPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Technical Support OS</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const [workersResult, vendorSourcesResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchVendorSources(token),
  ]);

  const workers = settle(workersResult).value ?? [];
  const vendorSources = settle(vendorSourcesResult).value ?? [];
  const loadError = workersResult.status === 'rejected' ? workersResult.reason : null;

  const assignedWorkerIds = new Set(vendorSources.map((vs) => vs.worker_id));
  const technicalSupportWorkers = workers.filter((worker) => assignedWorkerIds.has(worker.id));

  const personalities = await Promise.all(
    technicalSupportWorkers.map((worker) =>
      fetchWorkerPersonality(token, worker.id).catch(() => null)
    )
  );

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Worker Avatar</h1>
              <p className="lead">
                Real avatar rendering for each Technical Support worker — the built-in placeholder,
                or a real uploaded static image. No animated, 2D, or video avatar rendering exists
                on this platform yet.
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
            ) : technicalSupportWorkers.length === 0 ? (
              <p className="form-note">
                No worker is currently assigned to a vendor source yet. Assign one from{' '}
                <Link href="/portal/operating-systems/technical-support/vendor-sources">Vendor Sources</Link>.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {technicalSupportWorkers.map((worker, index) => {
                  const personality = personalities[index];
                  return (
                    <div
                      key={worker.id}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <AvatarPanel
                        voiceState="idle"
                        providerType={personality?.avatar_type ?? 'placeholder'}
                        avatarImageUrl={
                          personality?.has_avatar_image
                            ? `/api/portal/workers/${worker.id}/personality/avatar-image`
                            : null
                        }
                      />
                      <strong>{worker.name}</strong>
                      <Link
                        className="btn btn-secondary btn-small"
                        href={`/portal/operating-systems/technical-support/workers/${worker.id}/configure`}
                      >
                        Configure
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
