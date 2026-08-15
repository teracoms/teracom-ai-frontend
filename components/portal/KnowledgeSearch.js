'use client';

import { useState } from 'react';
import Link from 'next/link';

import EmptyState from '@/components/portal/EmptyState';

/**
 * Semantic search over the organisation's knowledge base (POST /search/,
 * Chroma + sentence-transformers — see FRONTEND_ARCHITECTURE_V1.md §C.8).
 * Distinct from KnowledgeListView's client-side substring filter: this calls
 * the real backend on submit, not a filter over already-fetched data, and is
 * the one genuinely new interaction pattern this package introduces — still
 * styled with the existing input/card conventions, not a new design system.
 */
export default function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/portal/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to search your knowledge base.');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search your knowledge base.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="assign-form" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Ask a question across your knowledge base"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Semantic search"
        />
        <button type="submit" className="btn btn-primary btn-small" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {results && (
        results.length === 0 ? (
          <EmptyState
            title="No matches found"
            description="Try different wording, or check that relevant documents have been uploaded."
          />
        ) : (
          <ul className="activity-list search-results">
            {results.map((result) => (
              <li key={result.id}>
                <div className="assignment-row">
                  <div>
                    <p className="activity-title">{result.title}</p>
                    <p className="activity-meta">{result.snippet}</p>
                  </div>
                  <span className="badge">{result.distance.toFixed(3)}</span>
                </div>
                <Link className="btn btn-secondary btn-small" href={`/portal/knowledge/${result.id}`}>
                  View Document
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
