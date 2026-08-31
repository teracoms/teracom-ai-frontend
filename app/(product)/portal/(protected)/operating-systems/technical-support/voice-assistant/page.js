import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchVendorSources } from '@/lib/api/vendorSources';
import { fetchVoiceProviderConfig } from '@/lib/api/voice';
import { settle, errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';
import TechnicalSupportVoiceAssistant from '@/components/portal/TechnicalSupportVoiceAssistant';

export const metadata = {
  title: 'Voice Assistant | Technical Support OS | Teracom AI Portal',
};

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- the real Voice Assistant
// surface, replacing the prior honest placeholder now that the loop it
// needs (speech-to-text, the grounded/cited POST /chat/, text-to-speech,
// avatar state) is real. Workers offered here are the same real,
// derived "assigned to a vendor source" set workers/page.js already
// established -- these are the workers that can actually answer a
// grounded question, not a fabricated department roster.
export default async function TechnicalSupportVoiceAssistantPage() {
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

  const [workersResult, vendorSourcesResult, voiceConfigResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchVendorSources(token),
    fetchVoiceProviderConfig(token),
  ]);

  const workers = settle(workersResult).value ?? [];
  const vendorSources = settle(vendorSourcesResult).value ?? [];
  const orgVoiceProviderConfig = settle(voiceConfigResult).value ?? null;
  const loadError = workersResult.status === 'rejected' ? workersResult.reason : null;

  const assignedWorkerIds = new Set(vendorSources.map((vs) => vs.worker_id));
  const technicalSupportWorkers = workers.filter((worker) => assignedWorkerIds.has(worker.id));

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>Voice Assistant</h1>
              <p className="lead">
                Speak or type a technical question — the answer is grounded in the worker&apos;s
                own ingested vendor documentation, always shown with its real source citations,
                and spoken back aloud when supported.
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
                <Link href="/portal/operating-systems/technical-support/vendor-sources">Vendor Sources</Link>{' '}
                before using the Voice Assistant.
              </p>
            ) : (
              <TechnicalSupportVoiceAssistant
                workers={technicalSupportWorkers}
                initialWorkerId={technicalSupportWorkers[0].id}
                orgVoiceProviderConfig={orgVoiceProviderConfig}
              />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
