import { getSessionToken } from '@/lib/api/auth';
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
            <UserListView users={users} />
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
