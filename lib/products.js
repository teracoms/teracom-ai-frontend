export const products = [
  // Access Control Products
  {
    id: 'securityos-starter',
    sku: 'SECOS-STARTER',
    name: 'SecurityOS Starter',
    description: 'Entry subscription for AI support agents and electronic security knowledge workflows.',
    priceCents: 4900,
    category: 'Software',
    type: 'subscription',
    features: ['AI Support', 'Knowledge Base', 'Security Workflows'],
  },
  {
    id: 'securityos-pro',
    sku: 'SECOS-PRO',
    name: 'SecurityOS Professional',
    description: 'Professional plan for support agents, scope generation, documentation and knowledge tools.',
    priceCents: 14900,
    category: 'Software',
    type: 'subscription',
    features: ['Scope Generation', 'Documentation Tools', 'Advanced Analytics'],
  },
  {
    id: 'sample-reader',
    sku: 'HW-READER-SAMPLE',
    name: 'Sample Access Control Reader',
    description: 'Professional access control reader for enterprise security systems.',
    priceCents: 29500,
    category: 'Access Control',
    type: 'hardware',
    features: ['RFID Compatible', 'IP67 Rated', 'Dual Interface'],
  },
  {
    id: 'access-controller',
    sku: 'AC-CTRL-PRO',
    name: 'Professional Access Controller',
    description: 'Multi-door access control system with advanced scheduling and reporting.',
    priceCents: 49900,
    category: 'Access Control',
    type: 'hardware',
    features: ['4 Doors', 'Cloud Integration', 'Mobile App'],
  },
  {
    id: 'mag-lock',
    sku: 'ML-5000',
    name: 'Electromagnetic Door Lock 5000N',
    description: 'Heavy-duty electromagnetic lock with fail-safe design.',
    priceCents: 34500,
    category: 'Access Control',
    type: 'hardware',
    features: ['5000N Force', 'IP65 Sealed', 'LED Status'],
  },

  // CCTV Products
  {
    id: 'cctv-4k-turret',
    sku: 'CCTV-4K-TUR',
    name: '4K Turret Camera',
    description: 'Ultra HD turret camera with 30x optical zoom and night vision.',
    priceCents: 45900,
    category: 'CCTV',
    type: 'hardware',
    features: ['4K Resolution', '30x Zoom', 'Night Vision', 'PoE'],
  },
  {
    id: 'cctv-nvr-16ch',
    sku: 'NVR-16CH-AI',
    name: '16-Channel AI NVR',
    description: 'Network video recorder with AI-powered motion detection and analytics.',
    priceCents: 89900,
    category: 'CCTV',
    type: 'hardware',
    features: ['16 Channels', 'AI Analytics', '4TB Storage', '4K Support'],
  },
  {
    id: 'milestone-vms',
    sku: 'MILESTONE-PRO',
    name: 'Milestone VMS Pro License',
    description: 'Enterprise video management software with unlimited camera support.',
    priceCents: 119900,
    category: 'CCTV',
    type: 'software',
    features: ['Unlimited Cameras', 'Mobile Client', 'Multi-site', 'Advanced Search'],
  },

  // Intrusion Detection
  {
    id: 'alarm-panel-pro',
    sku: 'ALARM-PRO-32',
    name: 'Professional Alarm Panel (32 Zone)',
    description: 'Advanced alarm control panel with wireless and wired zone support.',
    priceCents: 54900,
    category: 'Intrusion',
    type: 'hardware',
    features: ['32 Zones', 'Wireless Support', 'GSM Backup', 'LCD Display'],
  },
  {
    id: 'motion-detector',
    sku: 'PIR-MOTION-QUAD',
    name: 'Quad PIR Motion Detector',
    description: 'Advanced quad-element PIR sensor with pet immunity.',
    priceCents: 12900,
    category: 'Intrusion',
    type: 'hardware',
    features: ['Pet Immune', 'Quad Element', 'IP67', 'Adjustable Sensitivity'],
  },
  {
    id: 'door-window-sensor',
    sku: 'DOOR-SENS-WIRELESS',
    name: 'Wireless Door/Window Sensor',
    description: 'Wireless magnetic contact sensor for doors and windows.',
    priceCents: 4500,
    category: 'Intrusion',
    type: 'hardware',
    features: ['Wireless', '3-Year Battery', 'Surface Mount', 'Tamper Alert'],
  },

  // Services & Digital Products
  {
    id: 'sow-template-pack',
    sku: 'DIG-SOW-PACK',
    name: 'Security Scope of Works Template Pack',
    description: 'Digital template pack for electronic security project documentation and technical scopes.',
    priceCents: 19900,
    category: 'Digital',
    type: 'digital',
    features: ['30+ Templates', 'Editable Docs', 'Industry Standard', 'Updates Included'],
  },
  {
    id: 'design-review',
    sku: 'SVC-DESIGN-REVIEW',
    name: 'Security Design Review Consultation',
    description: 'Professional consulting service for architecture, product fit, risks, standards and technical validation.',
    priceCents: 69900,
    category: 'Services',
    type: 'service',
    features: ['4-Hour Session', 'Expert Consultant', 'Report Included', 'Follow-up Support'],
  },
  {
    id: 'system-integration',
    sku: 'SVC-INTEGRATION',
    name: 'System Integration Service',
    description: 'Full system integration and commissioning for security projects.',
    priceCents: 129900,
    category: 'Services',
    type: 'service',
    features: ['Full Integration', 'Testing', 'Training', 'Warranty Support'],
  },
];

export function formatMoney(cents) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
}

export function findProduct(id) {
  return products.find((p) => p.id === id);
}

export function getCategories() {
  const categories = [...new Set(products.map((p) => p.category))];
  return categories.sort();
}

export function getProductsByCategory(category) {
  return products.filter((p) => p.category === category);
}
