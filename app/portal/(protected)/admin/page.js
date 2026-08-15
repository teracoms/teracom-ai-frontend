import Link from 'next/link';

import { getSessionToken } from '@/lib/api/auth';
import { fetchUsers, fetchPermissions } from '@/lib/api/admin';
import { settle, errorMessage } from '@/lib/api/results';
import StatTile from '@/components/portal/StatTile';

export const metadata = {
  title: 'Administration | Teracom AI Portal',
};

export default async function AdminPage() {
  const token = getSessionToken();

  // Defensive only: the admin layout above already guarantees a session and
  // an admin role before this page renders — same precedent as every prior
  // package's entry page.
  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Administration</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view administration.</p>
          </div>
        </section>
      </main>
    );
  }

  const [usersResult, permissionsResult] = await Promise.allSettled([
    fetchUsers(token),
    fetchPermissions(token),
  ]);

  const users = settle(usersResult);
  const permissions = settle(permissionsResult);

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Administration</span>
            <h1>Manage your organisation.</h1>
            <p className="lead">
              Users, organisation profile, and knowledge↔worker permissions — all in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-grid stat-grid-2">
            {users.error ? (
              <p className="form-error" role="alert">
                {errorMessage(users.error)}
              </p>
            ) : (
              <StatTile label="Total Users" value={users.value.length} />
            )}
            {permissions.error ? (
              <p className="form-error" role="alert">
                {errorMessage(permissions.error)}
              </p>
            ) : (
              <StatTile label="Permission Grants" value={permissions.value.length} />
            )}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container feature-grid">
          <article>
            <h3>Users</h3>
            <p>Create organisation users and review who has access today.</p>
            <Link className="btn btn-secondary card-action" href="/portal/admin/users">
              Open Users
            </Link>
          </article>
          <article>
            <h3>Organisation</h3>
            <p>Read-only profile — name and slug, as teracom-ai-backend records them.</p>
            <Link className="btn btn-secondary card-action" href="/portal/admin/organisation">
              Open Organisation
            </Link>
          </article>
          <article>
            <h3>Permissions</h3>
            <p>Audit and bulk-manage which workers can access which knowledge documents.</p>
            <Link className="btn btn-secondary card-action" href="/portal/admin/permissions">
              Open Permissions
            </Link>
          </article>
          <article>
            <h3>Billing &amp; Licensing</h3>
            <p>Licence status, usage &amp; capacity, renewals, and entitlement requests.</p>
            <Link className="btn btn-secondary card-action" href="/portal/admin/billing">
              Open Billing &amp; Licensing
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
