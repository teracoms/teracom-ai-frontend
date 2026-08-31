import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';

export const metadata = {
  title: 'Voice Assistant | Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- explicitly out of scope for
 * this pass, per direct instruction. Real, reusable infrastructure already
 * exists elsewhere in this repo (lib/voice/voiceEngine.js, speechProvider.js,
 * selfHostedSpeechProvider.js) — a future pass wires it into this module,
 * not a fresh build. Honest placeholder, not a broken link.
 */
export default function TechnicalSupportVoiceAssistantPage() {
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
                Not built for Technical Support OS yet. This platform&apos;s own speech
                infrastructure (speech-to-text, text-to-speech) already exists and is real — a
                later phase wires it into this module.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
