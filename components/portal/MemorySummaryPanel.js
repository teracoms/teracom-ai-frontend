'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/portal/AuthProvider';
import { isAtLeastRole } from '@/lib/roles';

/**
 * Phase 0 Package H — one shared component for all three memory tiers
 * (organisation, department, worker), parametrised by `{scope, scopeId}`,
 * rather than three near-duplicate components. "Generate Summary" calls
 * POST /api/portal/memory-summaries → a real backend Ollama call that
 * condenses that scope's raw memory into one new, persisted summary row —
 * purely additive long-term retention; no raw memory is ever edited or
 * deleted by this (see MEMORY_INTELLIGENCE_IMPLEMENTATION_REPORT.md §6).
 * Access is gated backend-side per scope (organisation: admin-only;
 * department: any org member; worker: existing ownership check) plus the
 * Memory Enrichment capability (Enterprise+) — a 403 here just means this
 * organisation's tier or this user's role doesn't include it, not a bug.
 */
export default function MemorySummaryPanel({ scope, scopeId, summaries }) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleGenerate() {
    setError(null);
    setGenerating(true);

    try {
      const response = await fetch('/api/portal/memory-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, scope_id: scopeId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate a summary.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate a summary.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="memory-summary-panel">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {isAtLeastRole(user?.role, 'employee') && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Summary'}
        </button>
      )}

      {summaries.length === 0 ? (
        <p className="activity-meta">No summaries generated yet for this scope.</p>
      ) : (
        <ul className="activity-list memory-summary-list">
          {summaries.map((summary) => (
            <li key={summary.id}>
              <p className="activity-title">{summary.summary_content}</p>
              <p className="activity-meta">
                Condensed from {summary.source_count} memor{summary.source_count === 1 ? 'y' : 'ies'} ·{' '}
                {new Date(summary.generated_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
