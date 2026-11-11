const P = "/prototype";

export const routes = {
  index: P,
  designSystem: `${P}/design-system`,
  site: {
    home: `${P}/site`,
    inventory: `${P}/site/inventory`,
    vehicle: (slug: string) => `${P}/site/inventory/${slug}`,
    request: `${P}/site/request-a-vehicle`,
    requestPage: (id: string) => `${P}/site/request/${id}`,
    guides: `${P}/site/guides`,
    guide: (slug: string) => `${P}/site/guides/${slug}`,
    exportShipping: `${P}/site/guides`,
    about: `${P}/site#trust`,
    contact: `${P}/site#footer`,
  },
  track: {
    signIn: `${P}/track`,
    journey: `${P}/track/journey`,
  },
  emails: `${P}/emails`,
  documents: (type: "quotation" | "invoice" | "receipt") => `${P}/documents/${type}`,
  admin: {
    today: `${P}/admin`,
    vehicles: `${P}/admin/vehicles`,
    shipments: `${P}/admin/shipments`,
    shipment: (id: string) => `${P}/admin/shipments/${id}`,
    staff: `${P}/admin/staff`,
  },
  ceo: {
    dashboard: (page = "overview") => `${P}/ceo/dashboard/${page}`,
    approvals: `${P}/ceo/approvals`,
    enquiries: `${P}/ceo/enquiries`,
    quoteBuilder: `${P}/ceo/quotes/new`,
    requests: `${P}/ceo/requests`,
    payments: (id: string) => `${P}/ceo/payments/${id}`,
  },
} as const;

export const WHATSAPP_PLACEHOLDER = "[WhatsApp number]";

/** Click-to-chat link; the number is a placeholder until Decision 9. */
export function whatsappHref(message?: string) {
  return `https://wa.me/${encodeURIComponent(WHATSAPP_PLACEHOLDER)}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
export const DOMAIN_PLACEHOLDER = "raptorsauto.com";
