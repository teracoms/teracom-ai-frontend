import TechnicalSupportOSNav from '@/components/portal/TechnicalSupportOSNav';

export const metadata = {
  title: 'Worker Avatar | Technical Support OS | Teracom AI Portal',
};

/**
 * TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- explicitly out of scope for
 * this pass. Real avatar foundation already exists elsewhere in this repo
 * (lib/avatar/avatarProvider.js, components/portal/AvatarImage.js,
 * AvatarPanel.js) — a later phase wires it into this module.
 */
export default function TechnicalSupportAvatarPage() {
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
                Not built for Technical Support OS yet. This platform&apos;s own avatar
                foundation already exists and is real — a later phase wires avatar selection,
                upload, and voice-driven playback into this module.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
