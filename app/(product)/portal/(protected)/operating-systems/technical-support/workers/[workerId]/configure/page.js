import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchWorkerList } from '@/lib/api/workers';
import { fetchWorkerPersonality } from '@/lib/api/workerPersonality';
import { fetchVoiceProviderConfig } from '@/lib/api/voice';
import { settle, errorMessage } from '@/lib/api/results';
import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';
import WorkerPersonalityForm from '@/components/portal/WorkerPersonalityForm';
import AvatarPreviewTest from '@/components/portal/AvatarPreviewTest';

export const metadata = {
  title: 'Configure Voice & Avatar | Technical Support OS | Teracom AI Portal',
};

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- per-worker voice/avatar/
// personality configuration, reusing the real /workers/{id}/personality
// contract (teracom-ai-backend 428b3b2) and the real
// VoiceProviderConfiguration (VOICE_MIGRATION_V1) already used by
// OrchestratorChat.js, so voice_id is only ever resolved against
// self-hosted playback when the organisation genuinely has both real
// self-hosted engines configured.
export default async function ConfigureWorkerVoiceAvatarPage({ params }) {
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

  const { workerId } = params;

  const [workersResult, personalityResult, voiceConfigResult] = await Promise.allSettled([
    fetchWorkerList(token),
    fetchWorkerPersonality(token, workerId),
    fetchVoiceProviderConfig(token),
  ]);

  const workers = settle(workersResult).value ?? [];
  const worker = workers.find((w) => w.id === workerId);
  const personality = settle(personalityResult).value ?? null;
  const orgVoiceProviderConfig = settle(voiceConfigResult).value ?? null;
  const loadError = workersResult.status === 'rejected' ? workersResult.reason : null;

  // Real, currently-cached Kokoro voice set on this deployment
  // (services/worker_personality_service.py#SUPPORTED_TTS_VOICES) --
  // hardcoded here the same honest way the backend hardcodes its own
  // closed set, since there is no GET endpoint enumerating it. Update
  // both together if a further real voice is ever added.
  const voiceOptions = ['af_heart'];

  return (
    <>
      <TechnicalSupportOSNav />
      <main>
        <section className="hero hero-product">
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow">Technical Support OS</span>
              <h1>{worker ? `Configure ${worker.name}` : 'Configure Worker'}</h1>
              <p className="lead">
                Voice, avatar, and personality controls presentation and interaction style only —
                never permissions, governance, approval thresholds, security controls, escalation
                rules, or factual grounding.
              </p>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-secondary" href="/portal/operating-systems/technical-support/workers">
                Back to Technical Support Workers
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {loadError ? (
              <p className="form-error" role="alert">
                {errorMessage(loadError)}
              </p>
            ) : !worker ? (
              <p className="form-note">This worker was not found.</p>
            ) : (
              <>
                <WorkerPersonalityForm worker={worker} personality={personality} voiceOptions={voiceOptions} />

                <h2 style={{ marginTop: '2rem' }}>Preview &amp; test</h2>
                <AvatarPreviewTest
                  providerType={personality?.avatar_type ?? 'placeholder'}
                  avatarImageUrl={
                    personality?.has_avatar_image
                      ? `/api/portal/workers/${worker.id}/personality/avatar-image`
                      : null
                  }
                  voiceId={personality?.voice_id ?? null}
                  orgVoiceProviderConfig={orgVoiceProviderConfig}
                />
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
