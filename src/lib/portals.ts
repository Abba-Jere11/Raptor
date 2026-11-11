import type { PortalNavItem } from "@/components/ui/PortalShell";
import type { StaffRole } from "@/lib/db/types";
import { routes } from "@/lib/routes";

export const ADMIN_NAV: PortalNavItem[] = [
  { label: "Today", href: routes.admin.today },
  { label: "Vehicle records", href: routes.admin.vehicles },
  { label: "Photos & documents", href: routes.admin.media },
  { label: "Shipments" },
  { label: "Destinations", href: routes.admin.destinations },
  { label: "Staff accounts", href: routes.admin.staff },
  { label: "Roles & permissions", href: `${routes.admin.staff}#permissions` },
  { label: "Approved corrections" },
  { label: "Website structure", href: routes.admin.website },
  { label: "Integrations" },
  { label: "System settings" },
  { label: "Security" },
  { label: "Data tools" },
  { label: "System health" },
  { label: "Audit log" },
];

export const CEO_NAV: PortalNavItem[] = [
  { label: "Home", href: routes.ceo.home },
  { label: "Approvals", href: routes.ceo.approvals },
  { label: "Enquiries", href: routes.ceo.enquiries },
  { label: "Quotes", href: routes.ceo.quotes },
  { label: "Customers" },
  { label: "Vehicle requests" },
  { label: "Orders" },
  { label: "Payments" },
  { label: "Finance" },
  { label: "Vehicles", href: routes.ceo.vehicles },
  { label: "Shipments" },
  { label: "Destinations & rates", href: routes.ceo.destinations },
  { label: "Fees & pricing" },
  { label: "Website content", href: routes.ceo.website },
  { label: "Email templates", href: routes.ceo.templates },
  { label: "Staff & roles", href: routes.ceo.staff },
  { label: "Audit log", href: routes.ceo.audit },
  { label: "Reports" },
];

const CEO_ONLY = new Set(["Approvals", "Staff & roles", "Audit log", "Website content"]);
const SALES_HIDDEN = CEO_ONLY;
const FINANCE_HIDDEN = new Set([...CEO_ONLY, "Enquiries", "Email templates"]);

/** Sales and Finance can open the CEO portal; items outside their role stay disabled. */
export function ceoNav(role: StaffRole): PortalNavItem[] {
  if (role === "ceo") return CEO_NAV;
  const hidden = role === "finance" ? FINANCE_HIDDEN : SALES_HIDDEN;
  return CEO_NAV.map((n) => (hidden.has(n.label) ? { label: n.label } : n));
}
