'use client';

import { useMemo, useState } from 'react';

import KnowledgeCard from '@/components/portal/KnowledgeCard';
import EmptyState from '@/components/portal/EmptyState';

/**
 * Client-side search/filter over the full document list — the same pattern
 * WorkerListView.js established in Package 3. teracom-ai-backend's GET
 * /knowledge/ accepts no query parameters (no server-side filtering, sorting
 * or pagination exists — FRONTEND_ARCHITECTURE_V1.md §B.5.7), so this
 * filters the already-fetched array in the browser. This is distinct from
 * KnowledgeSearch, which calls the real semantic-search endpoint
 * (POST /search/) rather than filtering local data.
 */
export default function KnowledgeListView({ documents }) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');

  const sources = useMemo(
    () => Array.from(new Set(documents.map((document) => document.source))).sort(),
    [documents]
  );

  const filtered = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesQuery =
        !normalisedQuery ||
        document.title.toLowerCase().includes(normalisedQuery) ||
        document.content.toLowerCase().includes(normalisedQuery);
      const matchesSource = source === 'all' || document.source === source;
      return matchesQuery && matchesSource;
    });
  }, [documents, query, source]);

  return (
    <div>
      <div className="workers-toolbar">
        <input
          type="search"
          placeholder="Search by title or content"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search knowledge documents"
        />
        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          aria-label="Filter by source"
        >
          <option value="all">All sources</option>
          {sources.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="No knowledge documents yet"
          description="Upload your first document so your workers have knowledge to draw on in chat."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No documents match your search"
          description="Try a different title, keyword or source filter."
        />
      ) : (
        <div className="product-grid">
          {filtered.map((document) => (
            <KnowledgeCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
}
