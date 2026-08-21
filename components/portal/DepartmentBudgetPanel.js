'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Department budget tracking (Phase 0 Package M, objective #5) —
 * mirrors Proposal/Quote/Contract's submit -> admin-decide shape
 * (Package J). Parametrised by an optional `departmentId`: when
 * given (a single department's own dashboard), the submit form is
 * pre-scoped to that department and hidden from the picker; when
 * omitted (the org-wide Finance workspace), a department picker is
 * shown instead. Decide (approve/reject) buttons only render for an
 * admin — a presentation-layer convenience, the real gate is
 * backend-side — the concrete deliverable behind governance's "human
 * approval required for all financial commitments".
 */
export default function DepartmentBudgetPanel({ departmentId, departments, budgets }) {
  const { user } = useAuth();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(departmentId ?? departments?.[0]?.id ?? '');
  const [periodLabel, setPeriodLabel] = useState('');
  const [amountAllocated, setAmountAllocated] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedDepartmentId || !periodLabel.trim() || amountAllocated === '') return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/portal/department-budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: selectedDepartmentId,
          period_label: periodLabel.trim(),
          amount_allocated: Number(amountAllocated),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit this budget.');
      }

      setPeriodLabel('');
      setAmountAllocated('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this budget.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(budgetId, decision) {
    setError(null);

    try {
      const response = await fetch(`/api/portal/department-budgets/${budgetId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to record this decision.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record this decision.');
    }
  }

  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Budgets</span>
        <h2>Department budget tracking.</h2>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!isAtLeastRole(user?.role, 'employee') ? (
        <p className="form-note">You have read-only access and can&apos;t submit a budget.</p>
      ) : (
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        {!departmentId && departments?.length > 0 && (
          <select
            value={selectedDepartmentId}
            onChange={(event) => setSelectedDepartmentId(event.target.value)}
            disabled={submitting}
            aria-label="Department"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          value={periodLabel}
          onChange={(event) => setPeriodLabel(event.target.value)}
          placeholder="Period (e.g. Q3 2026)"
          disabled={submitting}
          aria-label="Period label"
        />
        <input
          type="number"
          value={amountAllocated}
          onChange={(event) => setAmountAllocated(event.target.value)}
          placeholder="Amount allocated"
          disabled={submitting}
          aria-label="Amount allocated"
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || !selectedDepartmentId || !periodLabel.trim() || amountAllocated === ''}
        >
          {submitting ? 'Submitting...' : 'Submit Budget'}
        </button>
      </form>
      )}

      {(!budgets || budgets.length === 0) ? (
        <p className="activity-meta">No department budgets yet.</p>
      ) : (
        <ul className="activity-list">
          {budgets.map((budget) => (
            <li key={budget.id}>
              <div className="assignment-row">
                <div>
                  <p className="activity-title">
                    {budget.period_label} <span className="badge">{budget.status}</span>
                  </p>
                  <p className="activity-meta">Amount allocated: {budget.amount_allocated}</p>
                </div>
                {budget.status === 'submitted' && isAtLeastRole(user?.role, 'admin') && (
                  <div>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => handleDecide(budget.id, 'approved')}
                    >
                      Approve
                    </button>{' '}
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => handleDecide(budget.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
