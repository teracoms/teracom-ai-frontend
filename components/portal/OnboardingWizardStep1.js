'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INDUSTRY_OPTIONS = ['Security', 'Professional Services', 'Technology', 'Other'];
const BUSINESS_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '200+'];

// CUSTOMER_ONBOARDING_WIZARD_V1.md §1.1 -- Organisation Setup, the one real
// step in Wizard Framework V1. Country is a plain text field for now
// (a full country picklist is real work in its own right, deliberately
// deferred rather than hand-built inaccurately for this foundation pass).
export default function OnboardingWizardStep1({
  organisationName,
  initialIndustry,
  initialCountry,
  initialBusinessSize,
  hasLogo,
  hasFavicon,
  initialPrimaryColor,
  initialSecondaryColor,
  stepAlreadyCompleted,
}) {
  const router = useRouter();
  const [industry, setIndustry] = useState(initialIndustry ?? '');
  const [industryOther, setIndustryOther] = useState(
    initialIndustry && !INDUSTRY_OPTIONS.includes(initialIndustry) ? initialIndustry : ''
  );
  const [country, setCountry] = useState(initialCountry ?? '');
  const [businessSize, setBusinessSize] = useState(initialBusinessSize ?? '');
  const [logoPreview, setLogoPreview] = useState(hasLogo ? '/api/portal/organisation/logo' : null);
  const [logoFile, setLogoFile] = useState(null);
  // CUSTOMER_ONBOARDING_WIZARD_V1.md Step 2 requirement #5, "Branding
  // Updates" -- extends this same Organisation Setup step, not a new
  // wizard step, matching the requirement's own wording ("Extend
  // Organisation Setup to support...").
  const [faviconPreview, setFaviconPreview] = useState(hasFavicon ? '/api/portal/organisation/favicon' : null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor ?? '#000000');
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor ?? '#ffffff');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(stepAlreadyCompleted);

  function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleFaviconChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFaviconFile(file);
    setFaviconPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const resolvedIndustry = industry === 'Other' ? industryOther.trim() : industry;

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const response = await fetch('/api/portal/organisation/logo', { method: 'POST', body: formData });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to upload logo.');
      }

      if (faviconFile) {
        const formData = new FormData();
        formData.append('file', faviconFile);
        const response = await fetch('/api/portal/organisation/favicon', { method: 'POST', body: formData });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to upload favicon.');
      }

      if (resolvedIndustry) {
        const response = await fetch('/api/portal/organisation/industry', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry: resolvedIndustry }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to save industry.');
      }

      const primaryChanged = primaryColor !== (initialPrimaryColor ?? '#000000');
      const secondaryChanged = secondaryColor !== (initialSecondaryColor ?? '#ffffff');

      if (country.trim() || businessSize || primaryChanged || secondaryChanged) {
        const response = await fetch('/api/portal/organisation/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country: country.trim() || undefined,
            business_size: businessSize || undefined,
            primary_brand_color: primaryChanged ? primaryColor : undefined,
            secondary_brand_color: secondaryChanged ? secondaryColor : undefined,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to save organisation profile.');
      }

      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: 1 }),
      });

      setCompleted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your organisation setup.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {completed && (
        <p className="form-note-banner" role="status">
          Organisation setup saved. You can update these details again any time — the rest of the
          wizard is coming soon.
        </p>
      )}

      <div>
        <label htmlFor="wizard-org-name">Organisation name</label>
        <input id="wizard-org-name" value={organisationName} disabled />
        <p className="activity-meta">
          Set when your organisation was created — not editable from this step yet.
        </p>
      </div>

      <div>
        <label htmlFor="wizard-logo">Logo</label>
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreview}
            alt="Organisation logo preview"
            style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, marginBottom: 8 }}
          />
        ) : (
          <p className="activity-meta">No logo uploaded yet — you&apos;ll see your organisation&apos;s
            initials shown instead until you add one.</p>
        )}
        <input id="wizard-logo" type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoChange} />
      </div>

      <div>
        <label htmlFor="wizard-favicon">Favicon</label>
        {faviconPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconPreview}
            alt="Organisation favicon preview"
            style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, marginBottom: 8 }}
          />
        ) : (
          <p className="activity-meta">No favicon uploaded yet — optional, shown in the browser tab.</p>
        )}
        <input id="wizard-favicon" type="file" accept=".png,.ico,.svg" onChange={handleFaviconChange} />
      </div>

      <div>
        <label htmlFor="wizard-primary-color">Primary brand colour</label>
        <input
          id="wizard-primary-color"
          type="color"
          value={primaryColor}
          onChange={(event) => setPrimaryColor(event.target.value)}
          style={{ width: 64, height: 40, padding: 2 }}
        />
        <p className="activity-meta">Recorded on your organisation now — applying it across the portal is planned separately.</p>
      </div>

      <div>
        <label htmlFor="wizard-secondary-color">Secondary brand colour</label>
        <input
          id="wizard-secondary-color"
          type="color"
          value={secondaryColor}
          onChange={(event) => setSecondaryColor(event.target.value)}
          style={{ width: 64, height: 40, padding: 2 }}
        />
      </div>

      <div>
        <label htmlFor="wizard-industry">Industry</label>
        <select id="wizard-industry" value={industry} onChange={(event) => setIndustry(event.target.value)}>
          <option value="">Select an industry</option>
          {INDUSTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {industry === 'Other' && (
          <input
            placeholder="Describe your industry"
            value={industryOther}
            onChange={(event) => setIndustryOther(event.target.value)}
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      <div>
        <label htmlFor="wizard-country">Country</label>
        <input
          id="wizard-country"
          placeholder="e.g. Australia"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="wizard-business-size">Business size</label>
        <select
          id="wizard-business-size"
          value={businessSize}
          onChange={(event) => setBusinessSize(event.target.value)}
        >
          <option value="">Select a size</option>
          {BUSINESS_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} people
            </option>
          ))}
        </select>
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save organisation setup'}
      </button>
    </form>
  );
}
