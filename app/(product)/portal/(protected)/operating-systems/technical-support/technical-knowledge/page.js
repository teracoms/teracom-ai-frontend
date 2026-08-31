import TechnicalSupportKnowledgeCategoryPage from '@/components/portal/TechnicalSupportKnowledgeCategoryPage';

export const metadata = {
  title: 'Technical Knowledge | Technical Support OS | Teracom AI Portal',
};

export default function TechnicalKnowledgePage() {
  return (
    <TechnicalSupportKnowledgeCategoryPage
      eyebrow="Technical Support OS"
      title="Technical Knowledge"
      lead="The same real, ingested vendor document pool as Product Documentation — this backend has no separate 'technical knowledge' signal yet, named honestly rather than fabricated."
      category="documentation"
    />
  );
}
