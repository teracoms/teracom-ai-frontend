import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchUsers } from '@/lib/api/admin';
import { errorMessage } from '@/lib/api/results';
import UserListView from '@/components/portal/UserListView';
import CreateUserForm from '@/components/portal/CreateUserForm';

export const metadata = {
  title: 'Users | Teracom AI Portal',
};

export default async function AdminUsersPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Users</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again to view users.</p>
          </div>
        </section>
      </main>
    );
  }

  // Belt-and-braces beyond the parent admin layout's role gate — see
  // admin/billing/usage/page.js's own identical comment and
  // TERACOM_REVIEW_BACKLOG.md WBL-013: the parent layout stops the
  // *rendered output* for a non-admin, but Next.js still executes this
  // child Server Component's own data fetch regardless. This was the
  // last of the original Package 7 admin pages missing this check.
  const viewerPayload = decodeJwtPayload(token);

  if (!isAtLeastRole(viewerPayload?.role, 'admin')) {
    return null;
  }

  let users = [];
  let loadError = null;

  try {
    users = await fetchUsers(token);
  } catch (error) {
    loadError = error;
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Users</span>
            <h1>Organisation users.</h1>
            <p className="lead">
              Create and review the people who can sign in to your organisation&apos;s Teracom AI
              portal.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loadError ? (
            <p className="form-error" role="alert">
              {errorMessage(loadError)}
            </p>
          ) : (
            <UserListView
              users={users}
              currentUserId={viewerPayload?.sub}
              viewerRole={viewerPayload?.role}
            />
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-heading left">
            <span className="eyebrow">Create</span>
            <h2>Add a new user.</h2>
          </div>
          <CreateUserForm />
        </div>
      </section>
    </main>
  );
}
