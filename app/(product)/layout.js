import '@teracoms/ui/globals.css';

export const metadata = {
  title: 'Teracom AI Portal',
  description: 'The Teracom AI product portal — workers, knowledge, tasks, and governance for your organisation.',
};

// Website / Application Separation Plan V1, Phase 4 — this repo's only
// root layout now that the marketing/commerce app has moved to
// teracom-solutions-website. Kept as a route group (rather than
// flattened to app/layout.js directly) since every page under
// app/(product)/portal and app/(product)/customer-portal keeps its own
// nested layout (session guards, PortalNav, AuthProvider, etc.)
// unchanged, and flattening isn't required for the split itself.
export default function ProductRootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
