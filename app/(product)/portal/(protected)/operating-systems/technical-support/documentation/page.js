import TechnicalSupportKnowledgeCategoryPage from '@/components/portal/TechnicalSupportKnowledgeCategoryPage';

export const metadata = {
  title: 'Product Documentation | Technical Support OS | Teracom AI Portal',
};

export default function ProductDocumentationPage() {
  return (
    <TechnicalSupportKnowledgeCategoryPage
      eyebrow="Technical Support OS"
      title="Product Documentation"
      lead="General vendor documentation ingested from your configured vendor sources — manuals, brochures, and datasheets not matched to a more specific category below."
      category="documentation"
    />
  );
}
