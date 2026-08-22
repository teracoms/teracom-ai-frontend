// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 requirement #4, "Workforce
// Visibility -- Show organisation structure visually wherever practical,"
// extended by Step 3 requirement #4 to the full four-tier hierarchy
// (Organisation -> Executive Team -> Departments -> Workers). Deliberately
// a plain server-renderable component (no 'use client', no hooks) -- a
// small CSS org-chart, not a graphing library, matching this codebase's
// own "practical, not novel" bar (see UI_IMPLEMENTATION_SPRINT_1.md item
// 7's own Workforce Visibility precedent).
//
// `executiveRoles`/`workers` are optional and independently controlled:
// omitting a prop entirely (`undefined`) skips that tier altogether,
// rather than rendering an always-empty band -- Step 2's own usage
// passes neither, so its visual is unchanged (Organisation -> Departments
// only). Step 3 passes both, giving the full four-tier hierarchy the
// requirement asks for.
//
// Step 4 requirement #4, "maintain and extend" -- each worker item may
// optionally carry `departmentLabel`/`executiveOwnerLabel` (precomputed
// by the caller from department_id/executive_owner_id, since this is a
// presentational component that doesn't fetch or cross-reference data
// itself); both are rendered as small tags exactly like a department's
// own `function` tag, and are simply omitted when absent.
export default function OrganisationStructureVisual({ organisationName, departments, executiveRoles, workers }) {
  const isFullHierarchy = executiveRoles !== undefined || workers !== undefined;

  return (
    <div className="org-structure-visual">
      <div className="org-structure-root">{organisationName}</div>

      {executiveRoles !== undefined && (
        <div className="org-structure-tier">
          <p className="org-structure-tier-label">Executive Team</p>
          {executiveRoles.length === 0 ? (
            <p className="activity-meta org-structure-empty">
              No executive roles selected yet — select one below to see it here.
            </p>
          ) : (
            <div className="org-structure-band">
              {executiveRoles.map((role) => (
                <div key={role.key} className="org-structure-role-card">
                  {role.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="org-structure-tier">
        {isFullHierarchy && <p className="org-structure-tier-label">Departments</p>}
        {departments.length === 0 ? (
          <p className="activity-meta org-structure-empty">
            No departments yet — create one below to see your organisation&apos;s structure here.
          </p>
        ) : (
          <div className="org-structure-band">
            {departments.map((department) => (
              <div key={department.id} className="org-structure-dept-card">
                <span className="org-structure-dept-name">{department.name}</span>
                {department.function && (
                  <span className="org-structure-dept-tag">{department.function}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {workers !== undefined && (
        <div className="org-structure-tier">
          <p className="org-structure-tier-label">Workers</p>
          {workers.length === 0 ? (
            <p className="activity-meta org-structure-empty">
              No workers yet — Digital Workforce setup is coming in a later wizard step.
            </p>
          ) : (
            <div className="org-structure-band">
              {workers.map((worker) => (
                <div key={worker.id} className="org-structure-worker-card">
                  <span className="org-structure-worker-name">{worker.name}</span>
                  {worker.departmentLabel && (
                    <span className="org-structure-worker-tag">{worker.departmentLabel}</span>
                  )}
                  {worker.executiveOwnerLabel && (
                    <span className="org-structure-worker-tag">owned by {worker.executiveOwnerLabel}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
