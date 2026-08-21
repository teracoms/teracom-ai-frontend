import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Role guard for the entire /portal/admin/** tree, per
 * FRONTEND_ARCHITECTURE_V1.md §C.11 ("/portal/admin is role-gated"). Every
 * page under this route group needs the identical check, so it lives once
 * here rather than being repeated per page — the same nested-layout pattern
 * app/portal/(protected)/layout.js already established for the session guard,
 * just for role instead of session.
 *
 * This is a presentation-layer gate only (§C.5): it exists so a non-admin
 * sees one clear, friendly message instead of a page that fetches and then
 * shows a raw 403 from each backend call. The real enforcement is backend-side
 * — GET/POST /users/, GET /organisations/, and POST /permissions/ are all
 * genuinely admin-gated via require_role("admin") (verified directly against
 * source, not assumed — see ADMIN_IMPLEMENTATION_REPORT.md §2). The one
 * exception is GET /permissions/, which has no role check at all; this layout
 * still gates the whole admin section as one consistent surface rather than
 * carving out a special case for the one read that doesn't strictly need it.
 */
export default function AdminLayout({ children }) {
  const token = getSessionToken();
  const isAdmin = token ? isAtLeastRole(decodeJwtPayload(token)?.role, 'admin') : false;

  if (!isAdmin) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Administration</span>
            <h1>This area requires admin access.</h1>
            <p className="lead">
              Ask an organisation admin for access, or sign in with an admin account.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
