/** MOCK DATA FOR DESIGN ONLY. Staff accounts and permission matrix (Part 1 §3). */

export type Role = "CEO" | "Administrator" | "Sales" | "Finance";

export const MOCK_STAFF: Array<{
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Deactivated" | "Pending";
  twoStep: boolean;
  lastSignIn: string;
  authorisedBy: string;
}> = [
  { id: "ST-01", name: "CEO", email: "ceo@[domain]", role: "CEO", status: "Active", twoStep: true, lastSignIn: "Today 07:44", authorisedBy: "Owner" },
  { id: "ST-02", name: "Administrator 01", email: "admin@[domain]", role: "Administrator", status: "Active", twoStep: true, lastSignIn: "Today 08:02", authorisedBy: "CEO · 1 Sep 2026" },
  { id: "ST-03", name: "Sales 01", email: "sales@[domain]", role: "Sales", status: "Active", twoStep: true, lastSignIn: "Yesterday", authorisedBy: "CEO · 3 Sep 2026" },
  { id: "ST-04", name: "Finance 01", email: "finance@[domain]", role: "Finance", status: "Pending", twoStep: false, lastSignIn: "Never", authorisedBy: "Awaiting CEO approval (AP-309)" },
  { id: "ST-05", name: "Former staff", email: "old@[domain]", role: "Sales", status: "Deactivated", twoStep: true, lastSignIn: "12 Aug", authorisedBy: "CEO · 2 Jun 2026" },
];

export type Access = "Full" | "Manage" | "Prepare" | "View" | "Record" | "None";

export const PERMISSION_AREAS: Array<{ area: string; access: Record<Role, Access> }> = [
  { area: "Vehicle inventory records", access: { CEO: "Full", Administrator: "Manage", Sales: "View", Finance: "View" } },
  { area: "Photos and listing (publish)", access: { CEO: "Full", Administrator: "Prepare", Sales: "None", Finance: "None" } },
  { area: "Customer information", access: { CEO: "Full", Administrator: "None", Sales: "Manage", Finance: "View" } },
  { area: "Financial records and margins", access: { CEO: "Full", Administrator: "None", Sales: "None", Finance: "View" } },
  { area: "Record payments received", access: { CEO: "Full", Administrator: "None", Sales: "None", Finance: "Record" } },
  { area: "Sourcing, bidding and deposits", access: { CEO: "Full", Administrator: "None", Sales: "None", Finance: "None" } },
  { area: "Shipment records and tracking", access: { CEO: "Full", Administrator: "Manage", Sales: "View", Finance: "View" } },
  { area: "Customer communication", access: { CEO: "Full", Administrator: "None", Sales: "Manage", Finance: "None" } },
  { area: "Staff accounts (create)", access: { CEO: "Full", Administrator: "Manage", Sales: "None", Finance: "None" } },
  { area: "Approvals", access: { CEO: "Full", Administrator: "None", Sales: "None", Finance: "None" } },
  { area: "Website structure and media", access: { CEO: "Full", Administrator: "Manage", Sales: "None", Finance: "None" } },
  { area: "Backups, security, system health", access: { CEO: "View", Administrator: "Manage", Sales: "None", Finance: "None" } },
];
