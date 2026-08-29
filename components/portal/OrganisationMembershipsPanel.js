'use client';

import { useState } from 'react';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

const ROLES = ['read_only', 'employee', 'manager', 'admin', 'owner'];

/**
 * ORG002 -- "Profile -> Organisations -> Switch Organisation."
 * Switching does not touch the session cookie at all: the backend
 * updates the same User.organisation_id/role every existing route in
 * this app already reads live on every request (see
 * teracom-ai-backend models/organisation_membership.py's own
 * docstring). A hard reload after a successful switch guarantees
 * every already-rendered piece of the app (nav, org pill, dashboard)
 * picks up the new organisation immediately, not just the next
 * navigation.
 */
export default function OrganisationMembershipsPanel({ memberships: initialMemberships }) {
  const { user } = useAuth();
  const canGrant = isAtLeastRole(user?.role, 'admin');

  const [memberships, setMemberships] = useState(initialMemberships);
  const [switching, setSwitching] = useState(null);
  const [error, setError] = useState(null);

  const [grantEmail, setGrantEmail] = useState('');
  const [grantRole, setGrantRole] = useState('employee');
  const [granting, setGranting] = useState(false);

  async function handleSwitch(organisationId) {
    setError(null);
    setSwitching(organisationId);
    try {
      const response = await fetch('/api/portal/organisation-memberships/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisation_id: organisationId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to switch organisations.');
      }

      // Hard reload, not router.refresh() -- every server-rendered
      // piece of the app (PortalNav's org pill, the dashboard itself)
      // needs to re-fetch against the now-changed organisation_id,
      // not just the route segment that happened to trigger this.
      window.location.href = '/portal/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to switch organisations.');
      setSwitching(null);
    }
  }

  async function handleGrant(event) {
    event.preventDefault();
    if (!grantEmail.trim()) return;

    setError(null);
    setGranting(true);
    try {
      const response = await fetch('/api/portal/organisation-memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: grantEmail.trim(), role: grantRole }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to grant this membership.');
      }

      setMemberships((current) => [...current, data]);
      setGrantEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to grant this membership.');
    } finally {
      setGranting(false);
    }
  }

  return (
    <div>
      <ul className="activity-list">
        {memberships.map((membership) => (
          <li key={membership.id}>
            <div className="assignment-row">
              <div>
                <p className="activity-title">
                  {membership.organisation_name}{' '}
                  {membership.is_current && <span className="badge badge-ok">Current</span>}{' '}
                  {membership.is_primary && <span className="badge badge-muted">Primary</span>}
                </p>
                <p className="activity-meta">Your role here: {membership.role}</p>
              </div>
              {!membership.is_current && (
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => handleSwitch(membership.organisation_id)}
                  disabled={switching !== null}
                >
                  {switching === membership.organisation_id ? 'Switching...' : 'Switch to this organisation'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {canGrant && (
        <div style={{ marginTop: '1.5rem' }}>
          <p className="eyebrow">Grant access to your organisation</p>
          <p className="form-note">
            The person must already have a Teracom AI account (in any organisation) — this does not create a
            new one.
          </p>
          <form className="contact-form" onSubmit={handleGrant} noValidate>
            <input
              type="email"
              value={grantEmail}
              onChange={(event) => setGrantEmail(event.target.value)}
              placeholder="Email address"
              disabled={granting}
              aria-label="Email address to grant access to"
            />
            <select value={grantRole} onChange={(event) => setGrantRole(event.target.value)} disabled={granting} aria-label="Role">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary btn-small" disabled={granting || !grantEmail.trim()}>
              {granting ? 'Granting...' : 'Grant Access'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
