const PROVIDER_LABELS = {
  ollama: 'Ollama',
  openai: 'GPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  copilot: 'Copilot (Microsoft)',
  grok: 'Grok (xAI)',
  openrouter: 'OpenRouter',
};

/**
 * MODELROUTE1 Phase 5 -- the Model Economics Director's real
 * comparison, read-only. Deliberately no "Quality" column -- that
 * figure is never fabricated (see teracom-ai-backend
 * services/model_economics_service.py's own module docstring).
 */
export default function ModelEconomicsComparison({ rows }) {
  return (
    <div>
      <ul className="activity-list">
        {rows.map((row) => (
          <li key={row.provider}>
            <div className="assignment-row">
              <span className="activity-title">{PROVIDER_LABELS[row.provider] ?? row.provider}</span>
              <span className="activity-meta">
                {row.has_data
                  ? `${Math.round(row.availability * 100)}% available · ${Math.round(row.avg_latency_ms)} ms avg · ${row.sample_size} recent calls · credit weight ${row.credit_weight ?? '—'}`
                  : `No call history yet · credit weight ${row.credit_weight ?? '—'} · falls back to a fixed default order`}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="form-note" style={{ marginTop: '12px' }}>
        No quality score is shown — a real, comparable quality metric would need a scoring
        methodology this platform hasn&apos;t built, and an invented number would be worse than
        none. Best Available ranks by real availability and latency once a provider has call
        history; cost tracking is not yet wired in.
      </p>
    </div>
  );
}
