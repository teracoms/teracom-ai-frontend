const PROVIDER_LABELS = {
  ollama: 'Ollama',
  openai: 'GPT (OpenAI)',
  anthropic: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
  copilot: 'Copilot (Microsoft)',
  grok: 'Grok (xAI)',
  openrouter: 'OpenRouter',
  deepseek: 'DeepSeek',
  qwen: 'Qwen (Alibaba Cloud)',
};

function costLabel(row) {
  if (row.estimated_relative_cost === null || row.estimated_relative_cost === undefined) {
    return `credit weight ${row.credit_weight ?? '—'}`;
  }
  return `~${row.estimated_relative_cost.toFixed(1)} relative cost units/call (credit weight ${row.credit_weight})`;
}

/**
 * MODELROUTE1 Phase 5 / CLOUD_PROVIDER_GUI_LIFECYCLE_V1 -- the Model
 * Economics Director's real comparison, read-only. Deliberately no
 * "Quality" column -- that figure is never fabricated (see
 * teracom-ai-backend services/model_economics_service.py's own module
 * docstring). Cost is real now (avg tokens per real call x a real,
 * admin-editable credit weight) but deliberately a relative,
 * credit-weighted unit, never a fabricated "$" figure -- this
 * platform has no real per-token USD pricing data for any provider.
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
                  ? `${Math.round(row.availability * 100)}% available · ${Math.round(row.avg_latency_ms)} ms avg · ${row.sample_size} recent calls · ${costLabel(row)}`
                  : `No call history yet · ${costLabel(row)} · falls back to a fixed default order`}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="form-note" style={{ marginTop: '12px' }}>
        No quality score is shown — a real, comparable quality metric would need a scoring
        methodology this platform hasn&apos;t built, and an invented number would be worse than
        none. Best Available ranks by real availability and latency once a provider has call
        history. Relative cost is real (real average token counts × an admin-editable weight),
        deliberately not a dollar estimate — no real $/token pricing has been entered for any
        provider.
      </p>
    </div>
  );
}
