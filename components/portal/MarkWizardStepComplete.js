'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Small, reusable "mark this wizard step complete" action for a step
// whose own content is otherwise pure presentation (Step 8's
// Organisation Review has no form of its own to hook a success
// callback into, unlike Steps 2-6's own create/select actions) --
// kept as its own tiny client component so the step it's used from
// can stay a Server Component.
export default function MarkWizardStepComplete({ step, label = 'Continue' }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);
    try {
      await fetch('/api/portal/onboarding-wizard/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_step: step }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleClick} disabled={saving}>
      {saving ? 'Saving...' : label}
    </button>
  );
}
