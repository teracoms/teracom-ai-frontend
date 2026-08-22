// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 requirement #4, "Workforce
// Visibility -- Show organisation structure visually wherever practical."
// Deliberately a plain server-renderable component (no 'use client', no
// hooks) -- a small CSS org-chart, not a graphing library, matching this
// codebase's own "practical, not novel" bar (see UI_IMPLEMENTATION_SPRINT_1.md
// item 7's own Workforce Visibility precedent).
//
// Shows Departments only, not individual Workers -- Wizard Step 2 is about
// organisation structure before any worker exists to place into it (Digital
// Workforce is Step 4, still design-only). Reused as-is once Step 4 exists,
// since `departments` is just data passed in, not fetched here.
export default function OrganisationStructureVisual({ organisationName, departments }) {
  return (
    <div className="org-structure-visual">
      <div className="org-structure-root">{organisationName}</div>
      {departments.length === 0 ? (
        <p className="activity-meta org-structure-empty">
          No departments yet — create one below to see your organisation&apos;s structure here.
        </p>
      ) : (
        <div className="org-structure-departments">
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
  );
}
