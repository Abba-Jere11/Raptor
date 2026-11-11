/** MOCK DATA FOR DESIGN ONLY. Dashboard series for the twelve release-1 charts (Section 16). */

const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export const MOCK_REVENUE_BY_MONTH = months.map((m, i) => ({
  month: m,
  revenue: [1320, 1180, 1410, 1560, 1490, 1720, 1650, 1880, 1790, 2010, 2140, 2280][i],
  previous: [1100, 1050, 1200, 1310, 1290, 1400, 1380, 1520, 1500, 1610, 1700, 1820][i],
}));

export const MOCK_GROSS_PROFIT = months.map((m, i) => ({
  month: m,
  profit: [150, 128, 168, 181, 170, 205, 196, 226, 211, 245, 259, 274][i],
  margin: [11.4, 10.8, 11.9, 11.6, 11.4, 11.9, 11.9, 12.0, 11.8, 12.2, 12.1, 12.0][i],
}));

export const MOCK_FUNNEL = [
  { stage: "Enquiries", count: 1940 },
  { stage: "Quotes sent", count: 620 },
  { stage: "Accepted", count: 141 },
  { stage: "Paid in full", count: 132 },
];

export const MOCK_REVENUE_BY_DESTINATION = [
  { market: "Nigeria", revenue: 5600 },
  { market: "UAE", revenue: 3900 },
  { market: "Ghana", revenue: 3200 },
  { market: "Kenya", revenue: 2100 },
  { market: "Jamaica", revenue: 1500 },
  { market: "Other", revenue: 2070 },
];

export const MOCK_CASH = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({
  month: m,
  received: [1610, 1840, 1720, 1960, 2080, 2050][i],
  outstanding: [420, 380, 510, 460, 540, 610][i],
}));

export const MOCK_INVENTORY_AGEING = [
  { band: "0–30", vehicles: 19 },
  { band: "31–60", vehicles: 14 },
  { band: "61–90", vehicles: 8 },
  { band: "91–120", vehicles: 4 },
  { band: "120+", vehicles: 2 },
];

export const MOCK_STOCK_MIX = [
  { type: "Exotic", vehicles: 18 },
  { type: "Luxury SUV", vehicles: 14 },
  { type: "Luxury saloon", vehicles: 9 },
  { type: "Pickup", vehicles: 4 },
  { type: "Other", vehicles: 2 },
];

export const MOCK_SHIPMENTS_BY_STAGE = [
  { stage: "Preparing", count: 6 },
  { stage: "At port", count: 3 },
  { stage: "Loaded", count: 2 },
  { stage: "At sea", count: 7 },
  { stage: "Arrived", count: 2 },
  { stage: "Released", count: 1 },
];

export const MOCK_OWN_VS_SOURCED = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({
  month: m,
  own: [7, 8, 6, 9, 8, 7][i],
  sourced: [3, 4, 5, 5, 6, 7][i],
}));

export const MOCK_REQUEST_RESPONSE = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({
  month: m,
  requests: [18, 22, 25, 24, 31, 34][i],
  hours: [6.5, 5.8, 5.1, 4.9, 4.2, 3.6][i],
}));

export const MOCK_LEAD_SOURCES = [
  { source: "WhatsApp", leads: 640, replyHours: 0.8 },
  { source: "Website form", leads: 720, replyHours: 2.4 },
  { source: "Request a Vehicle", leads: 310, replyHours: 1.9 },
  { source: "Email", leads: 180, replyHours: 5.2 },
  { source: "Referral", leads: 90, replyHours: 1.1 },
];

export const MOCK_DAYS_TO_SELL = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({
  month: m,
  days: [48, 44, 46, 39, 36, 33][i],
}));

export const MOCK_MARGIN_BY_VEHICLE = [
  { vehicle: "RA-0387 2012 Ferrari 458", sale: 171900, cost: 152400, margin: 19500, complete: true },
  { vehicle: "RQ-V-0099 Range Rover SV", sale: 182400, cost: 166900, margin: 15500, complete: true },
  { vehicle: "RA-O-2029 Mercedes-Benz G 63", sale: 214000, cost: null, margin: null, complete: false },
  { vehicle: "RQ-V-0104 Land Cruiser 300", sale: 92600, cost: 81300, margin: 11300, complete: true },
];

export const MOCK_RECEIVABLES_AGEING = [
  { band: "Not yet due", amount: 180250 },
  { band: "1–15 days", amount: 64000 },
  { band: "16–30 days", amount: 22500 },
  { band: "31+ days", amount: 8400 },
];

export const MOCK_EXCEPTIONS = [
  { kind: "Missed cut-off", ref: "RA-O-2026", detail: "72-hour deadline passed 29 Oct; title not yet at port", severity: "Urgent" },
  { kind: "Stale shipment", ref: "RA-O-2033", detail: "No update for 4 days", severity: "Pending" },
  { kind: "Shortfall", ref: "INV-2026-0183", detail: "Received $44,965 of $45,000 (bank charges $35)", severity: "Pending" },
  { kind: "Unpaid balance", ref: "INV-2026-0179", detail: "Balance $64,000 overdue 6 days", severity: "Urgent" },
  { kind: "Delay", ref: "RA-O-2031", detail: "Port congestion at Tema; new arrival 17–24 Nov", severity: "Pending" },
];

export const DASHBOARD_PAGES = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales" },
  { id: "margin", label: "Margin" },
  { id: "inventory", label: "Inventory" },
  { id: "pipeline", label: "Pipeline" },
  { id: "cash", label: "Cash" },
  { id: "exports", label: "Exports" },
  { id: "markets", label: "Markets" },
  { id: "exceptions", label: "Exceptions" },
] as const;
