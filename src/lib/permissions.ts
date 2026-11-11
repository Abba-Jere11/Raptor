import type { StaffRole } from "@/lib/db/types";

export type Access = "Full" | "Manage" | "Prepare" | "View" | "Record" | "None";

export const PERMISSION_AREAS: Array<{ area: string; access: Record<StaffRole, Access> }> = [
  { area: "Vehicle inventory records", access: { ceo: "Full", administrator: "Manage", sales: "View", finance: "View" } },
  { area: "Photos and listing (publish)", access: { ceo: "Full", administrator: "Prepare", sales: "None", finance: "None" } },
  { area: "Customer information", access: { ceo: "Full", administrator: "None", sales: "Manage", finance: "View" } },
  { area: "Financial records and margins", access: { ceo: "Full", administrator: "None", sales: "None", finance: "View" } },
  { area: "Record payments received", access: { ceo: "Full", administrator: "None", sales: "None", finance: "Record" } },
  { area: "Sourcing, bidding and deposits", access: { ceo: "Full", administrator: "None", sales: "None", finance: "None" } },
  { area: "Shipment records and tracking", access: { ceo: "Full", administrator: "Manage", sales: "View", finance: "View" } },
  { area: "Customer communication", access: { ceo: "Full", administrator: "None", sales: "Manage", finance: "None" } },
  { area: "Staff accounts (create)", access: { ceo: "Full", administrator: "Manage", sales: "None", finance: "None" } },
  { area: "Approvals", access: { ceo: "Full", administrator: "None", sales: "None", finance: "None" } },
  { area: "Website structure and media", access: { ceo: "Full", administrator: "Manage", sales: "None", finance: "None" } },
  { area: "Backups, security, system health", access: { ceo: "View", administrator: "Manage", sales: "None", finance: "None" } },
];

export const ROLE_LABEL: Record<StaffRole, string> = {
  ceo: "CEO",
  administrator: "Administrator",
  sales: "Sales",
  finance: "Finance",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  withdrawn: "Withdrawn",
  pending: "Pending",
  consumed: "Consumed",
  revoked: "Revoked",
  active: "Active",
  deactivated: "Deactivated",
  vehicle_publication: "Vehicle publication",
  vehicle_change: "Vehicle change",
  featured_selection: "Featured vehicle",
  delivery_entry: "Delivery",
  quote_discount: "Quotation discount",
  declined: "Declined",
  cancelled: "Cancelled",
};
