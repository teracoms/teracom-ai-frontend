import { redirect } from 'next/navigation';

// TECHNICAL_SUPPORT_OS_PRODUCT_INTEGRATION -- Vendor Sources moved out of
// generic Knowledge nav entirely, per direct instruction, into its own
// full-CRUD surface under Technical Support OS. This route redirects
// rather than being deleted, preserving any existing bookmark.
export default function VendorSourcesRedirect() {
  redirect('/portal/operating-systems/technical-support/vendor-sources');
}
