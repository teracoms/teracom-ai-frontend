// CUSTOMER_ONBOARDING_WIZARD_V1.md Step 5 -- Wizard Framework V5,
// "Knowledge Setup." The seven categories the requirement names,
// mapped onto teracom-ai-backend's own document_type values
// (services/metadata_service.py#DOCUMENT_TYPES) -- "Policy Documents"
// and "Templates" reuse the pre-existing "policy"/"template" values
// rather than duplicating them; the other five ("procedure", "sop",
// "training_material", "organisational_knowledge",
// "reference_document") were added specifically for this step.
//
// Plain data, deliberately not inside a 'use client' component -- see
// lib/portalNavGroups.js's own docstring for why (Next.js turns every
// export of a 'use client' file into a client-boundary reference,
// breaking any Server Component that tries to read it).
export const KNOWLEDGE_CATEGORIES = [
  {
    key: 'policy',
    label: 'Policy Documents',
    description: 'Formal statements of what your organisation does or does not allow.',
  },
  {
    key: 'procedure',
    label: 'Procedures',
    description: 'Step-by-step instructions for carrying out a specific task.',
  },
  {
    key: 'sop',
    label: 'SOPs',
    description: 'Standard Operating Procedures — the repeatable, approved way a task is done every time.',
  },
  {
    key: 'template',
    label: 'Templates',
    description: 'Reusable starting points — a document, email, or form shape to fill in rather than write from scratch.',
  },
  {
    key: 'training_material',
    label: 'Training Material',
    description: 'Content used to teach a person (or a Worker) how something works.',
  },
  {
    key: 'organisational_knowledge',
    label: 'Organisational Knowledge',
    description: 'General facts about your organisation that don\'t fit a more specific category — history, structure, how things are done here.',
  },
  {
    key: 'reference_document',
    label: 'Reference Documents',
    description: 'Material to look things up in, rather than read start to end.',
  },
];

export function knowledgeCategoryLabel(documentType) {
  return KNOWLEDGE_CATEGORIES.find((category) => category.key === documentType)?.label ?? documentType;
}
