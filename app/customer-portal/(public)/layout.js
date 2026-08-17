import { PortalContactAuthProvider } from '@/components/customer-portal/PortalContactAuthProvider';

// Wraps unauthenticated /customer-portal routes (currently just
// /customer-portal/login) — mirrors app/portal/(public)/layout.js.
export default function PublicCustomerPortalLayout({ children }) {
  return <PortalContactAuthProvider initialPortalContact={null}>{children}</PortalContactAuthProvider>;
}
