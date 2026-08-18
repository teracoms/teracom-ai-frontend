function formatBytes(bytes) {
  const gb = bytes / 1024 ** 3;
  return `${gb.toFixed(1)} GB`;
}

function statusBadgeClass(status) {
  return status === 'operational' ? 'badge status-operational' : 'badge status-down';
}

/**
 * "Platform Review Wave 1" objective #7 — real host CPU/memory/disk
 * figures and service reachability, admin-only. GPU is an honestly
 * labelled placeholder (no GPU integration exists yet) rather than a
 * fabricated reading — see services/system_resource_metrics_service.py.
 */
export default function SystemMetricsPanel({ metrics }) {
  return (
    <div>
      <div className="section-heading left">
        <span className="eyebrow">Admin only</span>
        <h2>System resources.</h2>
        <p>Live host metrics for the environment this backend runs on.</p>
      </div>

      <div className="stat-grid stat-grid-3">
        <div className="stat-tile">
          <span className="stat-hint">CPU</span>
          <p className="stat-value">{metrics.cpu.percent.toFixed(0)}%</p>
          <p className="stat-hint">{metrics.cpu.core_count} cores</p>
        </div>
        <div className="stat-tile">
          <span className="stat-hint">Memory</span>
          <p className="stat-value">{metrics.memory.percent.toFixed(0)}%</p>
          <p className="stat-hint">
            {formatBytes(metrics.memory.used_bytes)} / {formatBytes(metrics.memory.total_bytes)}
          </p>
        </div>
        <div className="stat-tile">
          <span className="stat-hint">Disk</span>
          <p className="stat-value">{metrics.disk.percent.toFixed(0)}%</p>
          <p className="stat-hint">
            {formatBytes(metrics.disk.used_bytes)} / {formatBytes(metrics.disk.total_bytes)}
          </p>
        </div>
      </div>

      <div className="system-services-row">
        {metrics.services.map((service) => (
          <div className="system-service-tile" key={service.name}>
            <p className="activity-title">{service.name}</p>
            <span className={statusBadgeClass(service.status)}>{service.status}</span>
            {service.latency_ms !== null && (
              <p className="stat-hint">{service.latency_ms} ms</p>
            )}
          </div>
        ))}

        <div className="system-service-tile system-service-future">
          <p className="activity-title">GPU</p>
          <span className="badge">Coming soon</span>
          <p className="stat-hint">Not yet supported</p>
        </div>
      </div>
    </div>
  );
}
