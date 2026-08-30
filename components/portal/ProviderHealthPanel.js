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

function statusLabel(row) {
  if (row.reachable === true) return `Reachable · ${row.latency_ms} ms`;
  if (row.reachable === false) return `Unreachable: ${row.error}`;
  if (row.error === 'not_implemented') return 'Not yet integrated in this environment';
  return 'No live check available for this provider yet';
}

function statusTone(row) {
  if (row.reachable === true) return 'ok';
  if (row.reachable === false) return 'warn';
  return 'muted';
}

/**
 * FEDERATION_AND_LOCAL_LLM_V1 -- real, live health (this instant) and
 * real, historical availability (from actual call history) for every
 * provider this platform knows the name of, GET /ai-provider-config/health.
 * Deliberately two separate lines, not one merged figure -- see that
 * endpoint's own docstring for why a passing health check and a real
 * generation call under load can honestly disagree.
 */
export default function ProviderHealthPanel({ statuses }) {
  return (
    <div>
      <ul className="activity-list">
        {statuses.map((row) => (
          <li key={row.provider}>
            <div className="assignment-row">
              <div>
                <p className="activity-title">
                  {PROVIDER_LABELS[row.provider] ?? row.provider}{' '}
                  <span className={`badge badge-${statusTone(row)}`}>
                    {statusTone(row) === 'ok' ? 'Healthy' : statusTone(row) === 'warn' ? 'Unreachable' : 'Not applicable'}
                  </span>
                </p>
                <p className="activity-meta">{statusLabel(row)}</p>
                <p className="activity-meta">
                  {row.historical_has_data
                    ? `Historical: ${Math.round(row.historical_availability * 100)}% availability · ${Math.round(row.historical_avg_latency_ms)} ms avg (recent real calls)`
                    : 'No real call history yet for this organisation'}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
