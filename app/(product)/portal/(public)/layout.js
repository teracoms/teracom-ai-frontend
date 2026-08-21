import { AuthProvider } from '@/components/portal/AuthProvider';

// Wraps unauthenticated /portal routes (currently just /portal/login) so
// client components there can still call useAuth().login(). No session guard
// here — that's the point of this route group vs. (protected).
export default function PublicPortalLayout({ children }) {
  return <AuthProvider initialUser={null}>{children}</AuthProvider>;
}
