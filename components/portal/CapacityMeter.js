/**
 * One resource's consumption vs. allocation — Workers, Users, or
 * Organisations, per docs/governance/BILLING_AND_LICENSING_UX.md's Usage &
 * Capacity section. `used` is always real, live data from an existing
 * backend endpoint (see app/portal/(protected)/admin/billing/usage/page.js);
 * `allocation` is the reference-licence ceiling (see lib/licensing/
 * referenceLicence.js) — illustrative, since no backend entitlement record
 * exists to enforce or verify it against. `allocationLabel`, used for
 * Enterprise/Platinum user counts, renders a per-contract label instead of a
 * bar, since that figure has no fixed platform default (LICENSING_MODEL_V1.md
 * §2/§5).
 */
export default function CapacityMeter({ label, used, allocation, allocationLabel }) {
  if (allocationLabel) {
    return (
      <div className="capacity-meter">
        <div className="capacity-meter-header">
          <span>{label}</span>
          <span>{used} in use</span>
        </div>
        <p className="form-note">{allocationLabel}</p>
      </div>
    );
  }

  const percent = allocation > 0 ? Math.min(100, Math.round((used / allocation) * 100)) : 0;

  return (
    <div className="capacity-meter">
      <div className="capacity-meter-header">
        <span>{label}</span>
        <span>
          {used} / {allocation}
        </span>
      </div>
      <div className="capacity-meter-track">
        <div className="capacity-meter-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
