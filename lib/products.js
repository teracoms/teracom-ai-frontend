export const products = [
  { id:'securityos-starter', sku:'SECOS-STARTER', name:'SecurityOS AI Starter', description:'Entry subscription for AI support agents and electronic security knowledge workflows.', priceCents:4900, type:'subscription', category:'SecurityOS AI' },
  { id:'securityos-pro', sku:'SECOS-PRO', name:'SecurityOS AI Professional', description:'Professional plan for support agents, scope generation, documentation and knowledge tools.', priceCents:14900, type:'subscription', category:'SecurityOS AI' },
  { id:'sow-template-pack', sku:'DIG-SOW-PACK', name:'Security Scope of Works Template Pack', description:'Digital template pack for electronic security project documentation and technical scopes.', priceCents:9900, type:'digital', category:'Digital Resources' },
  { id:'design-review', sku:'SVC-DESIGN-REVIEW', name:'Security Design Review', description:'Consulting service for architecture, product fit, risks, standards and technical validation.', priceCents:75000, type:'service', category:'Consulting' },
  { id:'sample-reader', sku:'HW-READER-SAMPLE', name:'Sample Access Control Reader', description:'Placeholder hardware product for supplier feed and catalogue testing.', priceCents:29500, type:'hardware', category:'Access Control' }
];
export function formatMoney(cents){return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(cents/100)}
export function findProduct(id){return products.find(p=>p.id===id)}
