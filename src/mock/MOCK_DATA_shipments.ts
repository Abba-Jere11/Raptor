/** MOCK DATA FOR DESIGN ONLY. Shipments, checklist, tracking updates (Figures 12, 13, 20). */

export const JOURNEY_STAGES = ["Paid", "Documents", "At port", "Loaded", "Sailed", "At sea", "Arrived", "Released"] as const;

export const MOCK_JOURNEY = {
  vehicle: "2022 Rolls-Royce Ghost",
  vin: "WDB…189186",
  vinEnding: "189186",
  order: "RA-O-2031",
  route: { from: "Miami", to: "Tema" },
  method: "Container",
  currentStage: 5,
  stageDates: ["12 Oct", "13 Oct", "14 Oct", "14 Oct", "15 Oct", undefined, undefined, undefined] as Array<string | undefined>,
  position: "Atlantic crossing",
  updated: "16 Oct, 09:10",
  arrivesInDays: 27,
  arrivalRange: "17 – 24 Nov",
  delay: {
    date: "16 Oct",
    reason: "Port congestion at Tema",
    note: "The vessel is expected to wait about 3 days to berth. We will update this page as soon as the berth is confirmed.",
    newRange: "17–24 Nov",
  },
  updates: [
    { title: "Delay notice", when: "16 Oct · 09:10", text: "Port congestion at Tema. New arrival range 17–24 Nov.", delay: true, photos: 0 },
    { title: "Sailed from Miami", when: "15 Oct · 18:30", text: "Vessel departed on schedule. Container sealed.", delay: false, photos: 0 },
    { title: "Loaded", when: "14 Oct · 11:00", text: "Loading photos added.", delay: false, photos: 4 },
    { title: "At port", when: "13 Oct · 15:45", text: "Delivered to the terminal. Export filing recorded by the forwarder.", delay: false, photos: 1 },
  ],
  documents: ["Commercial invoice", "Bill of lading", "Export title copy", "Condition report", "Receipts"],
  shipping: [
    { label: "Vessel", value: "[Vessel name]" },
    { label: "Container", value: "[Container no.]" },
    { label: "Bill of lading", value: "[B/L no.]" },
    { label: "Port of loading", value: "Miami, FL" },
    { label: "Port of discharge", value: "Tema, Ghana" },
  ],
  clearance: [
    { item: "Bill of lading (original or telex release)", done: true },
    { item: "Export title copy", done: true },
    { item: "Commercial invoice", done: true },
    { item: "Your clearing agent appointed", done: false },
    { item: "Local duty and taxes paid (set by your customs authority)", done: false },
  ],
};

export type ShipmentStage = "Preparing documents" | "At port" | "Loaded" | "At sea" | "Arrived" | "Released";

export const MOCK_SHIPMENTS: Array<{
  id: string;
  vehicle: string;
  destination: string;
  stage: ShipmentStage;
  forwarder: string;
  cutoff: string;
  deadline72: string;
  deadlineFlag: "ok" | "soon" | "missed";
  lastUpdate: string;
  stale: boolean;
  delayed: boolean;
  checklistDone: number;
  checklistTotal: number;
}> = [
  { id: "RA-O-2034", vehicle: "2014 Ferrari 458 Spider", destination: "Lagos, Nigeria", stage: "Preparing documents", forwarder: "[Forwarder A]", cutoff: "6 Nov 14:00", deadline72: "3 Nov 14:00", deadlineFlag: "soon", lastUpdate: "Today", stale: false, delayed: false, checklistDone: 4, checklistTotal: 15 },
  { id: "RA-O-2033", vehicle: "2015 Ferrari 458 Spider", destination: "Jebel Ali, UAE", stage: "At port", forwarder: "[Forwarder B]", cutoff: "2 Nov 10:00", deadline72: "30 Oct 10:00", deadlineFlag: "ok", lastUpdate: "28 Oct", stale: true, delayed: false, checklistDone: 9, checklistTotal: 15 },
  { id: "RA-O-2032", vehicle: "2013 Ferrari 458 Spider", destination: "Tema, Ghana", stage: "Loaded", forwarder: "[Forwarder A]", cutoff: "29 Oct 12:00", deadline72: "26 Oct 12:00", deadlineFlag: "ok", lastUpdate: "Yesterday", stale: false, delayed: false, checklistDone: 11, checklistTotal: 15 },
  { id: "RA-O-2031", vehicle: "2022 Rolls-Royce Ghost", destination: "Tema, Ghana", stage: "At sea", forwarder: "[Forwarder A]", cutoff: "13 Oct 12:00", deadline72: "10 Oct 12:00", deadlineFlag: "ok", lastUpdate: "16 Oct", stale: true, delayed: true, checklistDone: 12, checklistTotal: 15 },
  { id: "RA-O-2029", vehicle: "2020 Mercedes-Benz G 63", destination: "Lagos, Nigeria", stage: "Arrived", forwarder: "[Forwarder B]", cutoff: "20 Sep", deadline72: "17 Sep", deadlineFlag: "ok", lastUpdate: "30 Oct", stale: false, delayed: false, checklistDone: 14, checklistTotal: 15 },
  { id: "RA-O-2026", vehicle: "2014 Ferrari 458 Spider", destination: "Kingston, Jamaica", stage: "Preparing documents", forwarder: "[Forwarder C]", cutoff: "1 Nov 09:00", deadline72: "29 Oct 09:00", deadlineFlag: "missed", lastUpdate: "27 Oct", stale: true, delayed: false, checklistDone: 3, checklistTotal: 15 },
];

/** Export checklist (Part 1 §4.7). The platform records; licensed forwarders file. */
export const EXPORT_CHECKLIST = [
  { item: "Funds cleared", done: true },
  { item: "Buyer and consignee confirmed", done: true },
  { item: "Restricted-party screening", done: true },
  { item: "Title in hand", done: true },
  { item: "Lien released (if any)", done: true },
  { item: "Forwarder booked", done: true },
  { item: "Export filing and ITN recorded by the forwarder", done: false },
  { item: "72-hour deadline calculated from vessel cut-off", done: true },
  { item: "Delivered to port", done: false },
  { item: "Bill of lading", done: false },
  { item: "Vessel", done: false },
  { item: "Shipped", done: false },
  { item: "Documents sent", done: false },
  { item: "Arrived", done: false },
  { item: "Released", done: false },
];

export const DELAY_REASONS = [
  "Port congestion",
  "Vessel rescheduled or rolled",
  "Customs hold",
  "Weather",
  "Documentation pending",
  "Transshipment delay",
  "Strike",
  "Other (needs CEO approval)",
];

export const MOCK_TRACKING_HISTORY = [
  { when: "16 Oct 09:10", update: "Delay: port congestion", by: "Administrator 01" },
  { when: "14 Oct 18:30", update: "Sailed from Miami", by: "Administrator 01" },
  { when: "13 Oct 11:00", update: "Loaded (3 photos)", by: "Administrator 01" },
  { when: "12 Oct 15:45", update: "At port, filing done", by: "Administrator 01" },
];
