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

const CHECKED_AT_FORMATTER = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function statusLabel(row) {
  if (row.reachable === true) {
    return row.live_check
      ? `Reachable · ${row.latency_ms} ms`
      : `Verified as of ${row.checked_at ? CHECKED_AT_FORMATTER.format(new Date(row.checked_at)) : 'last check'}`;
  }
  if (row.reachable === false) {
    return row.live_check ? `Unreachable: ${row.error}` : `Verification failed: ${row.error}`;
  }
  if (row.error === 'not_implemented') return 'Not yet integrated in this environment';
  if (row.error === 'not_configured') return 'No credential configured for this organisation yet';
  if (row.error === 'disabled_by_admin') return 'Disabled by an admin — re-enable to route through it again';
  return 'No live check available for this provider yet';
}

function statusTone(row) {
  if (row.reachable === true) return 'ok';
  if (row.reachable === false) return 'warn';
  if (row.error === 'disabled_by_admin') return 'warn';
  return 'muted';
}

function statusPill(row) {
  if (row.reachable === true) return 'Healthy';
  if (row.reachable === false) return 'Unreachable';
  if (row.error === 'disabled_by_admin') return 'Disabled';
  return 'Not applicable';
}

/**
 * FEDERATION_AND_LOCAL_LLM_V1 / CLOUD_PROVIDER_GUI_LIFECYCLE_V1 --
 * health + real historical availability for every provider this
 * platform knows the name of, GET /ai-provider-config/health.
 * Deliberately two separate lines, not one merged figure. Ollama's
 * own health is genuinely live (checked fresh this instant, free); a
 * real cloud provider has no free live-check equivalent, so its own
 * "reachable" instead reflects its credential's last real
 * verification, honestly labelled "as of {date}" rather than implying
 * a live-this-second probe -- see services/provider_health_service.py's
 * own module docstring for the full reasoning.
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
                  <span className={`badge badge-${statusTone(row)}`}>{statusPill(row)}</span>
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
