/** MOCK DATA FOR DESIGN ONLY. Quotation, invoice, payments, enquiries, approvals. */
import { usd, type Money } from "@/lib/format";

export type QuoteLine = { label: string; amount: Money; note?: string };

/** Quotation lines the customer sees (Figure 11). Fee lines are TO CONFIGURE WITH RAPTORS (Decision 5). */
export const MOCK_QUOTE_LINES: QuoteLine[] = [
  { label: "Vehicle", amount: usd(214500) },
  { label: "Raptors fee", amount: usd(4200) },
  { label: "Inland transport", amount: usd(650) },
  { label: "Export preparation and documents", amount: usd(600) },
  { label: "Ocean freight (estimate)", amount: usd(3100) },
  { label: "Marine insurance (optional)", amount: usd(2200) },
];

export const quoteTotal = (lines: QuoteLine[]): Money => ({
  cents: lines.reduce((s, l) => s + l.amount.cents, 0),
  currency: "USD",
});

export const MOCK_ORDER = {
  id: "RA-O-2031",
  vehicle: "2022 Rolls-Royce Ghost · Arctic White",
  shipping: "Shipping to Tema, Ghana · container",
  quoteNo: "Q-2026-0187",
  invoiceNo: "INV-2026-0187",
  receiptNo: "REC-2026-0187-1",
  paymentRef: "RAG-0187",
  customer: "Customer name",
  customerAddress: "Address · Ghana",
  date: "20 Oct 2026",
  validUntil: "1 Nov 2026",
  total: usd(225250),
  deposit: usd(45000),
  balance: usd(180250),
  depositDue: "25 Oct",
  depositReceived: "22 Oct",
};

export const MOCK_ENQUIRIES: Array<{
  id: string;
  name: string;
  country: string;
  subject: string;
  channel: "Website" | "WhatsApp" | "Email";
  status: string;
  owner: string;
  received: string;
  waiting: string;
}> = [
  { id: "EN-1048", name: "Kwame A.", country: "Ghana", subject: "2013 Ferrari 458 Spider (RA-0412)", channel: "Website", status: "New", owner: "Unassigned", received: "Today 09:12", waiting: "38 min" },
  { id: "EN-1047", name: "Chidi O.", country: "Nigeria", subject: "2014 Ferrari 458 Spider (RA-0409)", channel: "WhatsApp", status: "New", owner: "CEO", received: "Today 08:40", waiting: "1 h 10 min" },
  { id: "EN-1046", name: "Fatima R.", country: "UAE", subject: "Shipping to Jebel Ali", channel: "Email", status: "Contacted", owner: "CEO", received: "Yesterday", waiting: "Follow up today" },
  { id: "EN-1044", name: "Daniel M.", country: "Kenya", subject: "2015 Ferrari 458 Spider (RA-0401)", channel: "Website", status: "Quoted", owner: "Sales 01", received: "29 Oct", waiting: "Quote expires 5 Nov" },
  { id: "EN-1041", name: "Andre B.", country: "Jamaica", subject: "Not ready yet: send me details", channel: "Website", status: "Negotiating", owner: "CEO", received: "27 Oct", waiting: "Follow up 3 Nov" },
  { id: "EN-1039", name: "Unknown", country: "—", subject: "Overpayment offer, cashier's cheque", channel: "Email", status: "Spam", owner: "—", received: "26 Oct", waiting: "—" },
];

export type ApprovalType =
  | "Vehicle publication"
  | "Vehicle change"
  | "Record correction"
  | "Staff account"
  | "Refund"
  | "Quote discount"
  | "Destination"
  | "Write-off"
  | "Status override";

export const MOCK_APPROVALS: Array<{
  id: string;
  type: ApprovalType;
  summary: string;
  requestedBy: string;
  requested: string;
  urgent: boolean;
  detail: string;
}> = [
  { id: "AP-311", type: "Vehicle publication", summary: "2013 Ferrari 458 Spider (RA-0398): publish listing", requestedBy: "Administrator 01", requested: "Today 08:05", urgent: true, detail: "34 photos · 360° ready · price $194,000 · documents: history, inspection" },
  { id: "AP-310", type: "Quote discount", summary: "Q-2026-0191: $3,000 discount (above limit)", requestedBy: "Sales 01", requested: "Today 07:50", urgent: true, detail: "Limit: [TO CONFIGURE WITH RAPTORS] · reason: repeat customer" },
  { id: "AP-309", type: "Staff account", summary: "New account: Finance 01 (Finance role)", requestedBy: "Administrator 01", requested: "Yesterday", urgent: false, detail: "Role grants payment recording; cannot approve refunds or write-offs" },
  { id: "AP-308", type: "Record correction", summary: "RA-0405 mileage 21,060 → 21,600", requestedBy: "Administrator 01", requested: "Yesterday", urgent: false, detail: "Reason: typo at entry; odometer photo attached" },
  { id: "AP-307", type: "Destination", summary: "Kenya · Mombasa: change to Open", requestedBy: "Administrator 01", requested: "30 Oct", urgent: false, detail: "Rate entered: $3,200 – $3,900 container, valid to 31 Dec" },
  { id: "AP-306", type: "Status override", summary: "RA-O-2027: book shipping before balance", requestedBy: "CEO (self-recorded)", requested: "29 Oct", urgent: false, detail: "Reason required and logged" },
];
