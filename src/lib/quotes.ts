import type {
  AcceptanceMethod,
  Customer,
  Destination,
  DestinationStatus,
  EnquiryKind,
  EnquiryStatus,
  Quote,
  QuoteLine,
  QuoteLineKind,
  QuoteLocalCharge,
  QuoteStatus,
  Vehicle,
} from "@/lib/db/types";

export const LINE_KIND_LABEL: Record<QuoteLineKind, string> = {
  vehicle: "Vehicle",
  raptors_fee: "Raptors fee",
  inland_transport: "Inland transport to port",
  export_documents: "Export preparation and documents",
  ocean_freight: "Ocean freight (estimate)",
  insurance: "Marine insurance (optional)",
  other: "Other",
  discount: "Discount",
};

export const EDITABLE_LINE_KINDS: QuoteLineKind[] = [
  "raptors_fee",
  "inland_transport",
  "export_documents",
  "ocean_freight",
  "insurance",
  "other",
  "discount",
];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  previewed: "Previewed",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  superseded: "Superseded",
};

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};

export const ENQUIRY_KIND_LABEL: Record<EnquiryKind, string> = {
  quote_request: "Quote request",
  enquiry: "Enquiry",
  information: "Send me the details",
};

export const DESTINATION_STATUS_LABEL: Record<DestinationStatus, string> = {
  open: "Open",
  confirm_each_time: "Confirm each time",
  not_served: "Not served",
};

export const ACCEPTANCE_METHOD_LABEL: Record<AcceptanceMethod, string> = {
  email: "By email",
  whatsapp: "On WhatsApp",
  phone: "By phone",
  in_person: "In person",
};

/** What the customer sees for a port before Milestone 7 adds dated estimates. */
export function destinationPublicState(status: DestinationStatus | null): string {
  if (status === "not_served") return "Not currently exported there";
  return "We will confirm";
}

function spanLabel(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} days`;
}

/** "Waiting 3 h" until someone first moves the enquiry on, then "Answered in 40 min". */
export function responseTimer(createdAt: string, firstResponseAt: string | null, nowMs: number): { label: string; late: boolean } {
  const created = Date.parse(createdAt);
  if (firstResponseAt) return { label: `Answered in ${spanLabel(Date.parse(firstResponseAt) - created)}`, late: false };
  const waited = nowMs - created;
  return { label: `Waiting ${spanLabel(waited)}`, late: waited > 24 * 3600 * 1000 };
}

export type QuoteTotals = { subtotalCents: number; discountCents: number; totalCents: number; localEstimateCents: number };

/** Mirrors quote_total_cents() in the database. Local charges are estimates paid locally and never in the total. */
export function quoteTotals(
  lines: Pick<QuoteLine, "kind" | "amount_cents">[],
  local: Pick<QuoteLocalCharge, "estimate_cents">[] = [],
): QuoteTotals {
  let subtotalCents = 0;
  let discountCents = 0;
  for (const line of lines) {
    if (line.kind === "discount") discountCents += line.amount_cents;
    else subtotalCents += line.amount_cents;
  }
  const localEstimateCents = local.reduce((sum, c) => sum + (c.estimate_cents ?? 0), 0);
  return { subtotalCents, discountCents, totalCents: subtotalCents - discountCents, localEstimateCents };
}

/** Parses a typed dollar amount ("4,200" or "4200.50") into integer cents. */
export function parseDollars(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, frac = ""] = clean.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export function vehicleTitle(v: Pick<Vehicle, "year" | "make" | "model" | "trim">): string {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
}

export function destinationLabel(d: Pick<Destination, "country" | "port"> | null): string {
  return d ? `${d.port}, ${d.country}` : "Destination to confirm";
}

export type QuoteDocument = {
  quote: Quote;
  lines: QuoteLine[];
  local: QuoteLocalCharge[];
  customer: Customer;
  vehicle: Vehicle;
  destination: Destination | null;
  settings: { legal_name: string | null; licence: string | null; city: string | null };
  totals: QuoteTotals;
};
