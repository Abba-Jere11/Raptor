import type { PortalNavItem } from "@/components/ui/PortalShell";
import { routes } from "./routes";

/** Administrator portal menu (Figure 19). Items without href are later milestones. */
export const ADMIN_NAV: PortalNavItem[] = [
  { label: "Today", href: routes.admin.today },
  { label: "Vehicle records", href: routes.admin.vehicles },
  { label: "Photos & documents" },
  { label: "Shipments", href: routes.admin.shipments, badge: 3 },
  { label: "Staff accounts", href: routes.admin.staff },
  { label: "Roles & permissions", href: `${routes.admin.staff}#permissions` },
  { label: "Approved corrections" },
  { label: "Website structure" },
  { label: "Integrations" },
  { label: "System settings" },
  { label: "Security" },
  { label: "Data tools" },
  { label: "System health" },
  { label: "Audit log" },
];

/** CEO portal menu (Figures 16-18). */
export const CEO_NAV: PortalNavItem[] = [
  { label: "Dashboard", href: routes.ceo.dashboard() },
  { label: "Approvals", href: routes.ceo.approvals, badge: 6 },
  { label: "Enquiries", href: routes.ceo.enquiries, badge: 2 },
  { label: "Quotes", href: routes.ceo.quoteBuilder },
  { label: "Customers" },
  { label: "Vehicle requests", href: routes.ceo.requests },
  { label: "Orders" },
  { label: "Payments", href: routes.ceo.payments("RA-O-2031") },
  { label: "Finance", href: routes.ceo.dashboard("cash") },
  { label: "Vehicles" },
  { label: "Shipments", href: routes.ceo.dashboard("exports") },
  { label: "Destinations & rates" },
  { label: "Fees & pricing" },
  { label: "Website content" },
  { label: "Staff & roles" },
  { label: "Reports" },
];
