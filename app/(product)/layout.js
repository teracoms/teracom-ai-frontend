import '../globals.css';

export const metadata = {
  title: 'Teracom AI Portal',
  description: 'The Teracom AI product portal — workers, knowledge, tasks, and governance for your organisation.',
};

// Website / Application Separation Plan V1, Phase 1 — the product's own
// root layout, carrying no marketing chrome (no Header/Footer). Before
// this, every /portal and /customer-portal page rendered inside the
// website's root layout (app/layout.js) purely because it was the only
// root layout that existed — not because the product was meant to look
// like a marketing page. This is the multiple-root-layouts pattern
// (see app/(marketing)/layout.js, its sibling); route groups don't
// appear in the URL, so every /portal/** and /customer-portal/** path
// is unchanged.
//
// Individual pages under app/(product)/portal and
// app/(product)/customer-portal keep their own nested layouts
// (session guards, PortalNav, AuthProvider, etc.) exactly as before —
// this layout only supplies the <html>/<body> shell and shared
// global styles, both of which every route in the app still needs
// regardless of which domain it belongs to.
export default function ProductRootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
