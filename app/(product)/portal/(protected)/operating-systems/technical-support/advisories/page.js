import TechnicalSupportKnowledgeCategoryPage from '@/components/portal/TechnicalSupportKnowledgeCategoryPage';

export const metadata = {
  title: 'Vendor Advisories | Technical Support OS | Teracom AI Portal',
};

export default function VendorAdvisoriesPage() {
  return (
    <TechnicalSupportKnowledgeCategoryPage
      eyebrow="Technical Support OS"
      title="Vendor Advisories"
      lead="Documents whose URL mentions an advisory, bulletin, recall, or security notice — a best-effort, title-based filter over the real ingested document pool, not a dedicated backend field."
      category="advisory"
    />
  );
}
