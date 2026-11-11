export type PublicNavItem = { href: string; label: string };

export type PublicChromeData = {
  nav: PublicNavItem[];
  footer: PublicNavItem[];
  whatsapp: string | null;
  legalName: string | null;
};

export function whatsappHref(e164: string) {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}
