import TechnicalSupportKnowledgeCategoryPage from '@/components/portal/TechnicalSupportKnowledgeCategoryPage';

export const metadata = {
  title: 'Software and Firmware | Technical Support OS | Teracom AI Portal',
};

export default function SoftwareAndFirmwarePage() {
  return (
    <TechnicalSupportKnowledgeCategoryPage
      eyebrow="Technical Support OS"
      title="Software and Firmware"
      lead="Documents whose URL mentions firmware, a release note, or a changelog — a best-effort, title-based filter over the real ingested document pool, not a dedicated backend field."
      category="firmware"
    />
  );
}
