import '../globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Teracom Solutions | AI, Security & Technical Solutions',
  description: 'Teracom Solutions combines electronic security expertise with AI, technical consulting, security system design, software innovation and the Teracom AI product family, including SecurityOS.',
};

// Website / Application Separation Plan V1, Phase 1 — this is now one of
// two root layouts (Next.js's "multiple root layouts" pattern via route
// groups), not the app's only one. `app/(product)/layout.js` is the
// other. Route groups don't appear in the URL, so every path this layout
// serves (/, /store, /checkout/*, /securityos-ai) is unchanged.
export default function MarketingRootLayout({ children }) {
  return (
    <html lang="en">
      <body><Header />{children}<Footer /></body>
    </html>
  );
}
