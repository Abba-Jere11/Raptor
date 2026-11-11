import { MOCK_VEHICLES } from "@/mock/MOCK_DATA_vehicles";
import { routes } from "./routes";

export type Screen = { name: string; href: string; figure?: string; note?: string; slug: string };
export type ScreenGroup = { title: string; description: string; screens: Screen[] };

const vehicle = MOCK_VEHICLES[0];
const sold = MOCK_VEHICLES.find((v) => v.status === "Sold")!;

/** Every prototype screen, grouped by experience. Also drives the Playwright screen list. */
export const SCREEN_GROUPS: ScreenGroup[] = [
  {
    title: "Design system",
    description: "Colours, type, buttons, chips, fields, cards, tabs and the contrast table.",
    screens: [{ name: "Design system", href: routes.designSystem, figure: "1", slug: "design-system" }],
  },
  {
    title: "Public website",
    description: "Laid out for desktop and phone.",
    screens: [
      { name: "Homepage", href: routes.site.home, figure: "2–4", slug: "site-home" },
      { name: "Inventory", href: routes.site.inventory, figure: "5", slug: "site-inventory" },
      { name: "Inventory · no results", href: `${routes.site.inventory}?q=lamborghini`, figure: "5", note: "Empty state", slug: "site-inventory-empty" },
      { name: "Vehicle page", href: routes.site.vehicle(vehicle.slug), figure: "6–7", slug: "site-vehicle" },
      { name: "Vehicle page · sold", href: routes.site.vehicle(sold.slug), figure: "6–7", note: "Sold state", slug: "site-vehicle-sold" },
      { name: "Request a Vehicle", href: routes.site.request, figure: "8–9", slug: "site-request" },
      { name: "Request tracker", href: routes.site.requestPage("RQ-V-0112"), figure: "10", slug: "site-request-page" },
      { name: "We found your vehicle", href: `${routes.site.requestPage("RQ-V-0112")}?view=found`, figure: "10", slug: "site-request-found" },
      { name: "Guides hub and trust list", href: routes.site.guides, figure: "15", slug: "site-guides" },
      { name: "One guide", href: routes.site.guide("import-a-vehicle-to-ghana"), figure: "15", slug: "site-guide" },
    ],
  },
  {
    title: "Journey Tracker",
    description: "The buyer's view after payment: VIN and Buyer ID, no password.",
    screens: [
      { name: "Sign in", href: routes.track.signIn, figure: "12", note: "Demo: VIN ending 189186, Buyer ID RAG-7K4Q-92XM-H6TD", slug: "track-sign-in" },
      { name: "Journey", href: routes.track.journey, figure: "12–13", slug: "track-journey" },
    ],
  },
  {
    title: "Emails and documents",
    description: "Designs only: nothing is sent and no PDF is generated in this milestone.",
    screens: [
      { name: "Six branded emails", href: routes.emails, figure: "14", slug: "emails" },
      { name: "Quotation", href: routes.documents("quotation"), figure: "11", slug: "doc-quotation" },
      { name: "Invoice with deposit schedule", href: routes.documents("invoice"), figure: "11", slug: "doc-invoice" },
      { name: "Receipt", href: routes.documents("receipt"), figure: "11", slug: "doc-receipt" },
    ],
  },
  {
    title: "Administrator portal",
    description: "Records and technical work. Never talks to customers, never touches money.",
    screens: [
      { name: "Today", href: routes.admin.today, slug: "admin-today" },
      { name: "Vehicle records", href: routes.admin.vehicles, figure: "19", slug: "admin-vehicles" },
      { name: "Shipment board", href: routes.admin.shipments, note: "Newly designed", slug: "admin-shipments" },
      { name: "Tracking update and delay", href: routes.admin.shipment("RA-O-2031"), figure: "20", slug: "admin-tracking" },
      { name: "Staff accounts and permissions", href: routes.admin.staff, note: "Newly designed", slug: "admin-staff" },
    ],
  },
  {
    title: "CEO portal",
    description: "The owner's view: decisions, money and the private sourcing figures.",
    screens: [
      { name: "Requests board and find-and-quote", href: routes.ceo.requests, figure: "16", slug: "ceo-requests" },
      { name: "Record a payment", href: routes.ceo.payments("RA-O-2031"), figure: "17", slug: "ceo-payment" },
      { name: "Dashboard · Overview", href: routes.ceo.dashboard(), figure: "18", slug: "ceo-dash-overview" },
      ...(["sales", "margin", "inventory", "pipeline", "cash", "exports", "markets", "exceptions"] as const).map((p) => ({
        name: `Dashboard · ${p[0].toUpperCase()}${p.slice(1)}`,
        href: routes.ceo.dashboard(p),
        note: "Newly designed",
        slug: `ceo-dash-${p}`,
      })),
      { name: "Enquiry inbox", href: routes.ceo.enquiries, note: "Newly designed", slug: "ceo-enquiries" },
      { name: "Quotation builder", href: routes.ceo.quoteBuilder, note: "Newly designed", slug: "ceo-quote-builder" },
      { name: "Approvals queue", href: routes.ceo.approvals, note: "Newly designed", slug: "ceo-approvals" },
    ],
  },
];

export const ALL_SCREENS: Screen[] = SCREEN_GROUPS.flatMap((g) => g.screens);
